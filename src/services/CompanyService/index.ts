import { CompanyEntity } from '../../entities/Company';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import { BaseService } from '../BaseService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import {
  CarbonIntensityMetricType,
  CompaniesBenchmarkInput,
  CompanyBenchmarkRes,
  CompanyProfile,
  CompanyStatus,
} from '../../types';
import { CompanySectorService } from '../CompanySectorService';
import { CarbonIntensityService } from '../CarbonIntensityService';
import { TargetService } from '../TargetService';
import { CompanyRelationshipService } from '../CompanyRelationshipService';
import { CompanyPrivacyService } from '../CompanyPrivacyService';

export class CompanyService extends BaseService<
  CompanyEntity,
  CompanyRepository
> {
  constructor(
    databaseService: DatabaseService,
    private companySectorService: CompanySectorService,
    private carbonIntensityService: CarbonIntensityService,
    private targetService: TargetService,
    private companyRelationshipService: CompanyRelationshipService,
    private companyPrivacyService: CompanyPrivacyService
  ) {
    super(databaseService, CompanyRepository);
  }

  async getCompaniesBenchmark(
    companyId: string,
    options: CompaniesBenchmarkInput
  ): Promise<CompanyBenchmarkRes> {
    const repository = await this.databaseService.getRepository(
      CompanyRepository
    );

    const divisionCompanies = await this.companySectorService.findCompanyIdsInTheDivision(
      companyId
    );

    const companiesBenchmark = await repository.getCompaniesBenchmark(
      companyId,
      divisionCompanies,
      options
    );

    return {
      data: companiesBenchmark,
      total: divisionCompanies.length,
    };
  }

  async getCompanyProfile(
    companyId: string,
    userCompanyId: string
  ): Promise<CompanyProfile> {
    const repository = await this.databaseService.getRepository(
      CompanyRepository
    );

    const [
      company,
      estimatedNumberOfEmployees,
      estimatedUsdOfRevenue,
      absoluteTarget,
      companySectors,
      activeRelationship,
      { hasAccess, companyPrivacy },
      dataShareRequest,
      pendingInvitation,
    ] = await Promise.all([
      repository.findOneOrFail(companyId),
      this.carbonIntensityService.getLatestEstimatedIntensity(
        companyId,
        CarbonIntensityMetricType.NumberOfEmployees
      ),
      this.carbonIntensityService.getLatestEstimatedIntensity(
        companyId,
        CarbonIntensityMetricType.UsdOfRevenue
      ),
      this.targetService.findAbsoluteTarget(companyId),
      this.companySectorService.findMany({
        where: { companyId },
        relations: ['sector'],
      }),
      this.companyRelationshipService.findActiveRelationship(
        userCompanyId,
        companyId
      ),
      this.companyPrivacyService.hasAccessToCompanyData(
        userCompanyId,
        companyId
      ),
      this.companyPrivacyService.findDataShareRequest(userCompanyId, companyId),
      this.companyRelationshipService.findPendingInvitation(
        userCompanyId,
        companyId
      ),
    ]);
    const sectors = companySectors.map(
      (companySector) => companySector.sector.name
    );
    return {
      id: company.id,
      name: company.name,
      duns: company.duns,
      dnbRegion: company.dnbRegion,
      isActive: company.status === CompanyStatus.Active,
      dnbCountryIso: company.dnbCountryIso,
      estimatedNumberOfEmployees: estimatedNumberOfEmployees?.intensityValue,
      estimatedUsdOfRevenue: estimatedUsdOfRevenue?.intensityValue,
      absoluteTargetType: absoluteTarget?.privacyType,
      sectors,
      activeRelationship,
      isPublic: hasAccess,
      dataShareRequestSent: Boolean(dataShareRequest),
      invitationPending: Boolean(pendingInvitation),
      companyPrivacy,
    };
  }
}
