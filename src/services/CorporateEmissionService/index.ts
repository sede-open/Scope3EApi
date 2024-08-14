import { FindConditions } from 'typeorm';
import { CORPORATE_EMISSION_UPDATED_ACTION } from '../../constants/audit';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { CorporateEmissionRepository } from '../../repositories/CorporateEmissionRepository';
import { CarbonIntensityMetricType, CorporateEmissionType } from '../../types';
import { AuditService } from '../AuditService';
import { BaseService } from '../BaseService';
import { CarbonIntensityService } from '../CarbonIntensityService';
import { CompanyPrivacyService } from '../CompanyPrivacyService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { FileService } from '../FileService';
import { ICorporateEmission, ICorporateEmissionService } from './types';

export class CorporateEmissionService
  extends BaseService<CorporateEmissionEntity, ICorporateEmission>
  implements ICorporateEmissionService {
  constructor(
    databaseService: DatabaseService,
    private auditService: AuditService,
    private carbonIntensityService: CarbonIntensityService,
    private fileService: FileService,
    private companyPrivacyService: CompanyPrivacyService
  ) {
    super(databaseService, CorporateEmissionRepository);
  }

  async findEmissionsMissingEstimatedUsdOfRevenue() {
    const repository = await this.databaseService.getRepository(
      CorporateEmissionRepository
    );

    return repository.findEmissionsMissingEstimatedIntensity(
      CarbonIntensityMetricType.UsdOfRevenue
    );
  }

  async findEmissionsMissingEstimatedNumberOfEmployees() {
    const repository = await this.databaseService.getRepository(
      CorporateEmissionRepository
    );

    return repository.findEmissionsMissingEstimatedIntensity(
      CarbonIntensityMetricType.NumberOfEmployees
    );
  }

  async updateEmission(attributes: ICorporateEmission) {
    const monitoredArgs: (keyof ICorporateEmission)[] = [
      'year',
      'scope1',
      'scope2',
      'scope3',
      'offset',
      'scope2Type',
      'examplePercentage',
      'headCount',
      'verificationFileId',
      'type',
    ];

    // if the type is updated to baseline, remove current baseline
    if (attributes.type === CorporateEmissionType.Baseline) {
      const oldBaseline = await this.findOne({
        where: {
          type: CorporateEmissionType.Baseline,
          companyId: attributes.companyId,
        },
      });
      if (oldBaseline && attributes.id !== oldBaseline.id) {
        oldBaseline.type = CorporateEmissionType.Actual;
        await this.update(oldBaseline);
      }
    }

    //if  year and baseline is changing this ID will be different. Need to get that years data
    const emission = await this.findOneOrFail({
      where: {
        id: attributes.id,
      },
    });

    const { verificationFileId } = emission;
    const deleteFile = attributes.verificationFileId !== verificationFileId;
    // for audit trail
    const {
      updatedEntity,
      previousPayload,
      currentPayload,
    } = this.auditService.objectUpdatesTracker({
      keysToTrack: monitoredArgs,
      updatedObject: attributes,
      originalObject: emission,
    });
    previousPayload.id = emission.id;
    currentPayload.id = attributes.id;

    const updatedEmission = await this.update(updatedEntity);

    //If new file uploaded, delete previous file
    if (deleteFile && verificationFileId) {
      await this.fileService.deleteFile(
        {
          id: verificationFileId,
        },
        attributes.companyId
      );
    }

    await this.auditService.createEntity(
      {
        userId: attributes.updatedBy as string,
        action: CORPORATE_EMISSION_UPDATED_ACTION,
      },
      currentPayload,
      previousPayload
    );

    return updatedEmission;
  }

  async deleteEntity(findConditions: FindConditions<CorporateEmissionEntity>) {
    const entityManager = this.databaseService.getEntityManager();
    if (entityManager) {
      this.fileService.setEntityManager(entityManager);
    }
    const corporateEmission = await this.findOneOrFail({
      where: {
        findConditions,
      },
    });
    await this.carbonIntensityService.deleteCarbonIntensity({
      year: corporateEmission.year,
      companyId: corporateEmission.companyId,
      emissionId: corporateEmission.id,
    });

    await this.remove([corporateEmission]);

    if (corporateEmission.verificationFileId) {
      this.fileService.deleteFile(
        { id: corporateEmission.verificationFileId },
        corporateEmission.companyId
      );
    }
  }

  async findEmissionsConsideringAccess(
    requestingCompanyId: string,
    targetCompanyId: string
  ): Promise<CorporateEmissionEntity[]> {
    const {
      hasAccess,
    } = await this.companyPrivacyService.hasAccessToCompanyData(
      requestingCompanyId,
      targetCompanyId
    );

    if (!hasAccess) {
      return [];
    }

    const repository = await this.databaseService.getRepository(
      CorporateEmissionRepository
    );

    return repository.findEmissionsConsideringAccess(targetCompanyId);
  }
}
