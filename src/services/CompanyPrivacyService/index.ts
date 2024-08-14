import { CompanyPrivacyEntity } from '../../entities/CompanyPrivacy';
import { CompanyPrivacyRepository } from '../../repositories/CompanyPrivacyRepository';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { BaseService } from '../BaseService';
import { CompanyPrivacy } from '../../repositories/CompanyPrivacyRepository/types';
import { CompanyRelationshipService } from '../CompanyRelationshipService';
import { CompanyRelationshipType } from '../../types';
import { HubspotEmailClient } from '../../clients/HubspotEmailClient';
import { DataShareRequestRepository } from '../../repositories/DataShareRequest';
import { UserService } from '../UserService';
import { AuditService } from '../AuditService';
import { ContextUser } from '../../entities/User';
import { DATA_SHARE_REQUEST_INSERTED } from '../../constants/audit';

export class CompanyPrivacyService extends BaseService<
  CompanyPrivacyEntity,
  CompanyPrivacy
> {
  constructor(
    databaseService: DatabaseService,
    private companyRelationshipService: CompanyRelationshipService,
    private userService: UserService,
    private auditService: AuditService,
    private hubspotEmailClient: HubspotEmailClient
  ) {
    super(databaseService, CompanyPrivacyRepository);
  }

  async hasAccessToCompanyData(userCompanyId: string, targetCompanyId: string) {
    const companyPrivacyRepository = await this.databaseService.getRepository(
      CompanyPrivacyRepository
    );
    const companyPrivacy = await companyPrivacyRepository.findOne({
      where: { companyId: targetCompanyId },
    });

    if (!companyPrivacy) {
      return { hasAccess: false, companyPrivacy };
    }

    if (companyPrivacy.allPlatform) {
      return { hasAccess: true, companyPrivacy };
    }

    const relationshipType = await this.companyRelationshipService.findActiveRelationship(
      targetCompanyId,
      userCompanyId
    );

    if (relationshipType === CompanyRelationshipType.Customer) {
      return { hasAccess: companyPrivacy.customerNetwork, companyPrivacy };
    }

    if (relationshipType === CompanyRelationshipType.Supplier) {
      return { hasAccess: companyPrivacy.supplierNetwork, companyPrivacy };
    }

    return { hasAccess: false, companyPrivacy };
  }

  async hasUserPopulatedAllDataPrivacyInfo(companyId: string) {
    const companyPrivacyRepository = await this.databaseService.getRepository(
      CompanyPrivacyRepository
    );

    /* These could have all gone into one query, but the SQL was far more difficult to interpret */
    const [
      { count: numCorporateEmissionAccessMissing },
      { count: numIntensityTargetPrivacyTypeMissing },
      { count: numAbsoluteTargetPrivacyTypeMissing },
    ] = await Promise.all([
      companyPrivacyRepository.numEmissionsMissingAccessInfo(companyId),
      companyPrivacyRepository.numIntensityTargetsMissingPrivacyType(companyId),
      companyPrivacyRepository.numAbsoluteTargetsMissingPrivacyType(companyId),
    ]);

    const isComplete = [
      numCorporateEmissionAccessMissing,
      numIntensityTargetPrivacyTypeMissing,
      numAbsoluteTargetPrivacyTypeMissing,
    ].every((count) => count === 0);

    return {
      isComplete,
      numCorporateEmissionAccessMissing,
      numIntensityTargetPrivacyTypeMissing,
      numAbsoluteTargetPrivacyTypeMissing,
    };
  }

  async findDataShareRequest(companyId: string, targetCompanyId: string) {
    if (companyId === targetCompanyId) {
      throw Error('You cannot request to find a relationship with yourself');
    }

    const dataShareRequestRepo = await this.databaseService.getRepository(
      DataShareRequestRepository
    );

    return dataShareRequestRepo.findOne({
      targetCompanyId,
      companyId,
    });
  }

  async sendDataShareRequest(targetCompanyId: string, user: ContextUser) {
    const { hasAccess } = await this.hasAccessToCompanyData(
      user.companyId,
      targetCompanyId
    );
    if (hasAccess) {
      throw Error('You already have access to this company data');
    }

    const existingRequest = await this.findDataShareRequest(
      user.companyId,
      targetCompanyId
    );

    if (existingRequest) {
      throw Error('You already requested access to this company data');
    }

    const companyEditors = await this.userService.findCompanyEditors(
      targetCompanyId
    );

    if (companyEditors.length === 0) {
      throw Error('No editors found for the company');
    }

    await Promise.all(
      companyEditors.map((recipient) => {
        return this.hubspotEmailClient.sendDataShareRequestEmail({
          recipient: {
            email: recipient.email,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
          },
          requesterName: `${user.firstName} ${user.lastName}`,
          requesterCompanyName: user.company.name,
        });
      })
    );

    return this.databaseService.transaction(async () => {
      const dataShareRequestRepo = await this.databaseService.getRepository(
        DataShareRequestRepository
      );
      const payload = {
        companyId: user.companyId,
        targetCompanyId,
        createdBy: user.id,
      };

      await this.auditService.createEntity(
        { userId: user.id, action: DATA_SHARE_REQUEST_INSERTED },
        payload,
        {}
      );

      const dataShareRequest = await dataShareRequestRepo.save(payload);
      return dataShareRequest;
    });
  }
}
