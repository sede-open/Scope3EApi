import { Connection, EntityManager } from 'typeorm';
import { getConfig, LaunchDarklyFlags } from '../../config';
import { getOrCreateDBConnection } from '../../dbConnection';
import { CompanyEntity } from '../../entities/Company';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { RoleEntity } from '../../entities/Role';
import { TargetEntity } from '../../entities/Target';
import { UserEntity } from '../../entities/User';
import { UserRepository } from '../../repositories/UserRepository';
import {
  CompanyRelationshipType,
  CorporateEmissionType,
  TargetType,
} from '../../types';
import { HubspotClient } from '../HubspotClient';
import { ContactProperties, HubspotObject } from '../HubspotClient/types';
import { getFlag } from '../LaunchDarklyClient';
import { getInviteLink } from '../NotificationClient/utils';

export class HubspotCrmClient {
  constructor(private readonly hubspotClient: HubspotClient) {}

  public async createCompany(
    { id, name, status, dnbCountry }: CompanyEntity,
    manager?: EntityManager | Connection
  ) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }
    const companyObject = await this.hubspotClient.createCompanyRequest({
      name,
      status,
      dnbCountry,
    });

    const connection = manager || (await getOrCreateDBConnection());
    await connection
      .getRepository(CompanyEntity)
      .update(id, { hubspotId: companyObject.id });

    return companyObject;
  }

  public async updateCompany(data: CompanyEntity) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }
    if (!data.hubspotId) {
      // create new HubSpot company object if does not exist
      return this.createCompany(data);
    }
    return this.hubspotClient.updateCompanyRequest(data.hubspotId, {
      name: data.name,
      status: data.status,
      dnbCountry: data.dnbCountry,
    });
  }

  public async updateCompanyEmission(
    corporateEmission: CorporateEmissionEntity
  ) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    const lastYear = new Date().getUTCFullYear() - 1;
    const isBaseline =
      corporateEmission.type === CorporateEmissionType.Baseline;
    const isLastYearEmission = corporateEmission.year === lastYear;

    if (!isBaseline && !isLastYearEmission) {
      return;
    }

    let company = corporateEmission.company;

    if (!company) {
      const connection = await getOrCreateDBConnection();
      company = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(corporateEmission.companyId);
    }
    if (!company.hubspotId) {
      return;
    }

    const baselineScope1 = isBaseline ? corporateEmission.scope1 : undefined;
    const lastYearScope1 = isLastYearEmission
      ? corporateEmission.scope1
      : undefined;

    return this.hubspotClient.updateCompanyRequest(company.hubspotId, {
      name: company.name,
      status: company.status,
      dnbCountry: company.dnbCountry,
      baselineScope1,
      lastYearScope1,
    });
  }

  public async updateCompanyTarget(target: TargetEntity) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    if (target.targetType !== TargetType.Absolute) {
      return;
    }
    let company = target.company;

    if (!company) {
      const connection = await getOrCreateDBConnection();
      company = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(target.companyId);
    }

    const companyHubspotId = company.hubspotId;

    if (!companyHubspotId) {
      return;
    }

    return this.hubspotClient.updateCompanyRequest(companyHubspotId, {
      name: company.name,
      status: company.status,
      dnbCountry: company.dnbCountry,
      ambition: target.reduction,
    });
  }

  public async deleteCompanyTarget(target: TargetEntity) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    if (target.targetType !== TargetType.Absolute) {
      return;
    }
    let company = target.company;

    if (!company) {
      const connection = await getOrCreateDBConnection();
      company = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(target.companyId);
    }

    const companyHubspotId = company.hubspotId;
    if (!companyHubspotId) {
      return;
    }

    return this.hubspotClient.updateCompanyRequest(companyHubspotId, {
      name: company.name,
      status: company.status,
      dnbCountry: company.dnbCountry,
      ambition: '',
    });
  }

  public async deleteLastYearEmission(
    deletedEmission: CorporateEmissionEntity
  ) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    const lastYear = new Date().getUTCFullYear() - 1;
    const isLastYearEmission = deletedEmission.year === lastYear;

    if (!isLastYearEmission) {
      return;
    }

    let company = deletedEmission.company;

    if (!company) {
      const connection = await getOrCreateDBConnection();
      company = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(deletedEmission.companyId);
    }
    if (!company.hubspotId) {
      return;
    }

    return this.hubspotClient.updateCompanyRequest(company.hubspotId, {
      name: company.name,
      status: company.status,
      dnbCountry: company.dnbCountry,
      lastYearScope1: '',
    });
  }

  private async updateFirstSupplierInvited(data: CompanyRelationshipEntity) {
    let customer = data.customer;
    if (!customer) {
      const connection = await getOrCreateDBConnection();
      customer = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(data.customerId);
    }
    if (!customer.hubspotId) {
      return;
    }
    return this.hubspotClient.updateCompanyRequest(customer.hubspotId, {
      name: customer.name,
      status: customer.status,
      dnbCountry: customer.dnbCountry,
      firstSupplierInvited: 'True',
    });
  }

  private async updateFirstCustomerInvited(data: CompanyRelationshipEntity) {
    let supplier = data.supplier;
    if (!supplier) {
      const connection = await getOrCreateDBConnection();
      supplier = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(data.supplierId);
    }
    if (!supplier.hubspotId) {
      return;
    }

    return this.hubspotClient.updateCompanyRequest(supplier.hubspotId, {
      name: supplier.name,
      status: supplier.status,
      dnbCountry: supplier.dnbCountry,
      firstCustomerInvited: 'True',
    });
  }

  public async updateFirstInvitation(data: CompanyRelationshipEntity) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    if (data.inviteType === CompanyRelationshipType.Supplier) {
      return this.updateFirstSupplierInvited(data);
    }

    return this.updateFirstCustomerInvited(data);
  }

  public async updateEmissionAllocation(data: EmissionAllocationEntity) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled || !data.supplierId || !data.emissions) {
      return;
    }

    let supplier = data.supplier;
    if (!supplier) {
      const connection = await getOrCreateDBConnection();
      supplier = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(data.supplierId);
    }
    if (!supplier.hubspotId) {
      return;
    }

    return this.hubspotClient.updateCompanyRequest(supplier.hubspotId, {
      name: supplier.name,
      status: supplier.status,
      dnbCountry: supplier.dnbCountry,
      firstCustomerInvited: 'True',
      emissionsAllocation: data.emissions,
    });
  }

  private async getUserRolesFormatted(user: UserEntity) {
    let roles = user.roles;
    if (!roles) {
      const connection = await getOrCreateDBConnection();
      const userRepository = connection.getCustomRepository(UserRepository);
      roles = await userRepository.getRelation<RoleEntity>(user, 'roles');
    }

    return roles.map(({ name }) => name).join(';');
  }

  public async createContact(
    data: UserEntity,
    inviter?: UserEntity,
    manager?: EntityManager | Connection
  ) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    let company = data.company;
    const connection = manager || (await getOrCreateDBConnection());
    if (!company) {
      company = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(data.companyId, {
          lock: {
            mode:
              // We create the company and the user in the same transaction in case of a new company invitation
              // dirty_read allows us to read the new not-committed company
              'dirty_read',
          },
        });
    }

    let companyHubspotId = company.hubspotId;

    if (!companyHubspotId) {
      const companyObject = await this.createCompany(company, connection);
      companyHubspotId = companyObject!.id;
    }

    const properties: ContactProperties = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      status: data.status,
      createdAt: new Date(data.createdAt).toISOString(),
      roles: await this.getUserRolesFormatted(data),
      companyName: company.name,
    };

    if (inviter) {
      const inviterCompany = await connection
        .getRepository(CompanyEntity)
        .findOneOrFail(inviter.companyId);

      properties.inviterName = `${inviter.firstName} ${inviter.lastName}`;
      properties.inviterCompanyName = inviterCompany.name;
      properties.inviteLink = getInviteLink(data);
    }

    let contactObject: HubspotObject;
    try {
      contactObject = await this.hubspotClient.createContactRequest(properties);
    } catch (error) {
      /*  In case the user has already been created from other sources (track code).
       ** So we don't have the hubspot_id in the db, so we try to create the contact
       ** but if contact already exists with the email address, it returns an error message
       ** with the hubspot id in it and we extract the id and update the contact object associating it with its company.
       **
       */
      if (error.message.startsWith('Contact already exists. Existing ID: ')) {
        const contactId = error.message.replace(
          'Contact already exists. Existing ID: ',
          ''
        );
        contactObject = await this.hubspotClient.updateContactRequest(
          contactId,
          properties
        );
      } else {
        throw error;
      }
    }

    const returnResult = await this.associateContactWithCompany({
      contact: contactObject,
      companyId: companyHubspotId,
    });

    await connection
      .getRepository(UserEntity)
      .update(data.id, { hubspotId: contactObject.id });

    return returnResult;
  }

  public async updateContact(data: UserEntity) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    if (!data.hubspotId) {
      return this.createContact(data);
    }

    let company = data.company;
    if (!company) {
      const connection = await getOrCreateDBConnection();
      if (!company) {
        company = await connection
          .getRepository(CompanyEntity)
          .findOneOrFail(data.companyId);
      }
    }

    return this.hubspotClient.updateContactRequest(data.hubspotId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      status: data.status,
      createdAt: new Date(data.createdAt).toISOString(),
      roles: await this.getUserRolesFormatted(data),
      companyName: company.name,
    });
  }

  public async associateContactWithCompany(data: {
    contact: HubspotObject;
    companyId: string;
  }) {
    const isHubspotCrmEnabled = await getFlag(
      LaunchDarklyFlags.HUBSPOT_CRM_ENABLED,
      false
    );
    if (!isHubspotCrmEnabled) {
      return;
    }

    return this.hubspotClient.associateContactWithCompany(
      data.contact.id,
      data.companyId
    );
  }

  public async deleteContact(data: UserEntity) {
    if (!data.hubspotId) {
      return;
    }

    const contactObject = await this.hubspotClient.deleteContactRequest(
      data.hubspotId
    );

    // Delete hubspotId on the soft deleted user row
    const connection = await getOrCreateDBConnection();
    await connection
      .getCustomRepository(UserRepository)
      .update(data.id, { hubspotId: undefined });

    return contactObject;
  }
}

export const hubspotCrmClient = new HubspotCrmClient(
  new HubspotClient(getConfig().hubspotCrmToken)
);
