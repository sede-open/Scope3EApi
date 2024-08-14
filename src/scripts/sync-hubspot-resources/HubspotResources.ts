import { Connection, Repository } from 'typeorm';
import { uniqBy } from 'lodash';
import { CompanyEntity } from '../../entities/Company';
import { UserRepository } from '../../repositories/UserRepository';
import { logger } from '../../utils/logger';
import {
  companyQueue,
  companyRelationshipQueue,
  corporateEmissionQueue,
  emissionAllocationQueue,
  targetQueue,
  userQueue,
} from '../../jobs/queues';
import {
  addJobCompanyCreatedToQueue,
  addJobCompanyUpdatedToQueue,
} from '../../jobs/tasks/company/queue';
import {
  addJobUserCreatedToQueue,
  addJobUserUpdatedToQueue,
} from '../../jobs/tasks/user/queue';
import {
  CompanyRelationshipType,
  CorporateEmissionType,
  TargetType,
} from '../../types';
import { addJobCorporateEmissionUpdatedToQueue } from '../../jobs/tasks/corporateEmission/queue';
import { addJobTargetUpdatedToQueue } from '../../jobs/tasks/target/queue';
import { TargetRepository } from '../../repositories/TargetRepository';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { getFlag } from '../../clients/LaunchDarklyClient';
import { LaunchDarklyFlags } from '../../config';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { addJobCompanyRelationshipCreatedToQueue } from '../../jobs/tasks/companyRelationship/queue';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { addJobEmissionAllocationCreatedToQueue } from '../../jobs/tasks/emissionAllocation/queue';

export class HubspotResources {
  constructor(
    private readonly connection: Connection,
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly userRepository: UserRepository,
    private readonly targetRepository: TargetRepository,
    private readonly corporateEmissionRepository: Repository<CorporateEmissionEntity>,
    private readonly companyRelationshipRepository: Repository<CompanyRelationshipEntity>,
    private readonly emissionAllocationRepository: Repository<EmissionAllocationEntity>
  ) {}

  private getCompaniesFromDb() {
    return this.companyRepository.find();
  }

  private getUsersFromDb() {
    return this.userRepository.find({
      where: {
        isDeleted: false,
      },
      relations: ['roles', 'company'],
    });
  }

  private getCorporateEmissions() {
    // baseline or last year
    return this.corporateEmissionRepository.find({
      where: [
        { type: CorporateEmissionType.Baseline },
        { year: new Date().getUTCFullYear() - 1 },
      ],
    });
  }

  private getAbsoluteTargets() {
    return this.targetRepository.find({
      where: {
        targetType: TargetType.Absolute,
      },
    });
  }

  private async getSupplierInviters() {
    const supplierInvitations = await this.companyRelationshipRepository.find({
      where: {
        inviteType: CompanyRelationshipType.Supplier,
      },
      relations: ['customer'],
    });
    // could not make a query with DISTINCT customer_id statement with TypeORM
    return uniqBy(supplierInvitations, 'customerId');
  }

  private async getCustomerInviters() {
    const customerInvitations = await this.companyRelationshipRepository.find({
      where: {
        inviteType: CompanyRelationshipType.Customer,
      },
      relations: ['supplier'],
    });
    // could not make a query with DISTINCT supplier_id statement with TypeORM
    return uniqBy(customerInvitations, 'supplierId');
  }

  private async getEmissionAllocations() {
    const emissionAllocations = await this.emissionAllocationRepository.find();
    // could not make a query with DISTINCT supplier_id statement with TypeORM
    return uniqBy(emissionAllocations, 'supplierId');
  }

  private async syncCompanies() {
    const companies = await this.getCompaniesFromDb();
    await Promise.all(
      companies.map((company) => {
        if (company.hubspotId) {
          return addJobCompanyUpdatedToQueue(
            { updated: company },
            { delay: 100 }
          );
        } else {
          return addJobCompanyCreatedToQueue(company, { delay: 100 });
        }
      })
    );
    logger.info(
      { count: companies.length },
      'Added jobs to create Hubspot companies'
    );
  }

  private async syncUsers() {
    const users = await this.getUsersFromDb();
    await Promise.all(
      users.map((user) => {
        if (user.hubspotId) {
          return addJobUserUpdatedToQueue({ updated: user }, { delay: 100 });
        } else {
          return addJobUserCreatedToQueue({ user }, { delay: 100 });
        }
      })
    );

    logger.info(
      { count: users.length },
      'Added jobs to create Hubspot contacts'
    );
  }

  private async syncCorporateEmissions() {
    const corporateEmissions = await this.getCorporateEmissions();

    await Promise.all(
      corporateEmissions.map((corporateEmission) => {
        // Will update the last year emission data as well
        return addJobCorporateEmissionUpdatedToQueue(
          { updated: corporateEmission },
          { delay: 100 }
        );
      })
    );

    logger.info(
      { count: corporateEmissions.length },
      'Added jobs to update Hubspot companies with baseline or last year emission data'
    );
  }

  private async syncAbsoluteTargets() {
    const absoluteTargets = await this.getAbsoluteTargets();
    await Promise.all([
      absoluteTargets.map((target) => {
        return addJobTargetUpdatedToQueue({ updated: target }, { delay: 100 });
      }),
    ]);
    logger.info(
      { count: absoluteTargets.length },
      'Added jobs to update Hubspot companies with absolute ambition data'
    );
  }

  private async syncCompanyRelationships() {
    const [supplierInviters, customerInviters] = await Promise.all([
      this.getSupplierInviters(),
      this.getCustomerInviters(),
    ]);
    await Promise.all(
      supplierInviters.concat(customerInviters).map((companyRelationship) => {
        return addJobCompanyRelationshipCreatedToQueue(companyRelationship, {
          delay: 100,
        });
      })
    );
    logger.info(
      {
        supplierInviters: supplierInviters.length,
        customerInviters: customerInviters.length,
      },
      'Added jobs to update Hubspot companies with company first supplier/customer invited data'
    );
  }

  private async syncEmissionsAllocation() {
    const emissionAllocations = await this.getEmissionAllocations();
    await Promise.all(
      emissionAllocations.map((allocation) => {
        return addJobEmissionAllocationCreatedToQueue(allocation, {
          delay: 100,
        });
      })
    );
    logger.info(
      { count: emissionAllocations.length },
      'Added jobs to update Hubspot emission allocation data'
    );
  }

  private async cleanupAndExit(exitCode: number) {
    try {
      await Promise.all([
        companyQueue.close(),
        corporateEmissionQueue.close(),
        targetQueue.close(),
        userQueue.close(),
        this.connection.close(),
      ]);
    } finally {
      process.exit(exitCode);
    }
  }

  public async run() {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );

    if (!isHubspotCrmEnabled) {
      logger.info('Feature flag disabled. Canceling!');
      return;
    }
    try {
      await this.syncCompanies();
    } catch (error) {
      logger.error(error, 'Failed to sync company data');
      await this.cleanupAndExit(1);
    }

    companyQueue.once('global:drained', async () => {
      try {
        await this.syncCorporateEmissions();
      } catch (error) {
        logger.error(error, 'Failed to sync corporate emission data');
        await this.cleanupAndExit(1);
      }
    });

    corporateEmissionQueue.once('global:drained', async () => {
      try {
        await this.syncAbsoluteTargets();
      } catch (error) {
        logger.error(error, 'Failed to sync target data');
        await this.cleanupAndExit(1);
      }
    });

    targetQueue.once('global:drained', async () => {
      try {
        await this.syncCompanyRelationships();
      } catch (error) {
        logger.error(error, 'Failed to sync company relationship data');
        await this.cleanupAndExit(1);
      }
    });

    companyRelationshipQueue.once('global:drained', async () => {
      try {
        await this.syncEmissionsAllocation();
      } catch (error) {
        logger.error(error, 'Failed to sync emission allocation data');
        await this.cleanupAndExit(1);
      }
    });

    emissionAllocationQueue.once('global:drained', async () => {
      try {
        await this.syncUsers();
        await this.cleanupAndExit(0);
      } catch (error) {
        logger.error(error, 'Failed to sync user data');
        await this.cleanupAndExit(1);
      }
    });
  }
}
