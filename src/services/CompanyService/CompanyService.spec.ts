import { CompanyService } from '.';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import {
  CarbonIntensityMetricType,
  CompaniesBenchmarkInput,
  CompanyRelationshipType,
  CompanyStatus,
  TargetPrivacyType,
} from '../../types';
import { CarbonIntensityService } from '../CarbonIntensityService';
import { CompanyPrivacyService } from '../CompanyPrivacyService';
import { CompanyRelationshipService } from '../CompanyRelationshipService';
import { CompanySectorService } from '../CompanySectorService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { TargetService } from '../TargetService';

describe('CompanyService', () => {
  describe('getCompaniesBenchmark', () => {
    it('calls the repository to get the benchmark data', async () => {
      const companyId = 'company-id';
      const options = ({
        intensityMetric: 'USD_OF_REVENUE',
        limit: 25,
        offset: 10,
        order: 'ASC',
        orderBy: 'companyName',
      } as unknown) as CompaniesBenchmarkInput;
      const companiesInTheDivision = ['company-1', 'company-2', 'company-3'];
      const benchmarkData = companiesInTheDivision.map((companyId) => ({
        companyId,
      }));
      const getCompaniesBenchmark = jest
        .fn()
        .mockResolvedValueOnce(benchmarkData);
      const databaseService = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          getCompaniesBenchmark,
        }),
      } as unknown) as DatabaseService;

      const findCompanyIdsInTheDivision = jest
        .fn()
        .mockResolvedValueOnce(companiesInTheDivision);
      const companySectorService = ({
        findCompanyIdsInTheDivision,
      } as unknown) as CompanySectorService;

      const companyService = new CompanyService(
        databaseService,
        companySectorService,
        {} as CarbonIntensityService,
        {} as TargetService,
        {} as CompanyRelationshipService,
        {} as CompanyPrivacyService
      );
      const result = await companyService.getCompaniesBenchmark(
        companyId,
        options
      );

      expect(getCompaniesBenchmark).toBeCalledWith(
        companyId,
        companiesInTheDivision,
        options
      );
      expect(findCompanyIdsInTheDivision).toBeCalledWith(companyId);
      expect(result.total).toEqual(companiesInTheDivision.length);
    });
  });
  describe('getCompanyProfile', () => {
    it('calls to get all the data and returns them correctly', async () => {
      const userCompanyId = 'user-company-id';
      const company = {
        id: 'company-id',
        name: 'company-name',
        duns: 'duns',
        dnbRegion: 'dnb-region',
        dnbCountryIso: 'dnb-country',
        status: CompanyStatus.Active,
      };
      const findOneOrFail = jest.fn().mockResolvedValueOnce(company);
      const getRepository = jest.fn().mockResolvedValueOnce({ findOneOrFail });
      const dbService = ({
        getRepository,
      } as unknown) as DatabaseService;

      const companySectors = [
        { sector: { name: 'sector-name-1' } },
        { sector: { name: 'sector-name-2' } },
      ];
      const companySectorService = ({
        findMany: jest.fn().mockResolvedValueOnce(companySectors),
      } as unknown) as CompanySectorService;

      const numberOfEmployees = {
        intensityValue: 1000,
      };
      const usdOfRevenue = {
        intensityValue: 1000000,
      };
      const carbonIntensityService = ({
        getLatestEstimatedIntensity: jest
          .fn()
          .mockResolvedValueOnce(numberOfEmployees)
          .mockResolvedValueOnce(usdOfRevenue),
      } as unknown) as CarbonIntensityService;

      const absoluteTarget = { privacyType: TargetPrivacyType.Public };
      const targetService = ({
        findAbsoluteTarget: jest.fn().mockResolvedValueOnce(absoluteTarget),
      } as unknown) as TargetService;

      const activeRelationship = CompanyRelationshipType.Customer;
      const pendingInvitation = undefined;
      const companyRelationshipService = ({
        findActiveRelationship: jest.fn().mockResolvedValue(activeRelationship),
        findPendingInvitation: jest.fn().mockResolvedValue(pendingInvitation),
      } as unknown) as CompanyRelationshipService;

      const companyPrivacy = { allPlatform: true };
      const hasAccess = { hasAccess: true, companyPrivacy };
      const dataShareRequest = { id: 'data-share-request-id' };
      const companyPrivacyService = ({
        hasAccessToCompanyData: jest.fn().mockResolvedValueOnce(hasAccess),
        findDataShareRequest: jest.fn().mockResolvedValueOnce(dataShareRequest),
      } as unknown) as CompanyPrivacyService;

      const companyService = new CompanyService(
        dbService,
        companySectorService,
        carbonIntensityService,
        targetService,
        companyRelationshipService,
        companyPrivacyService
      );

      const result = await companyService.getCompanyProfile(
        company.id,
        userCompanyId
      );

      expect(getRepository).toBeCalledWith(CompanyRepository);
      expect(findOneOrFail).toHaveBeenCalledWith(company.id);
      expect(carbonIntensityService.getLatestEstimatedIntensity).toBeCalledWith(
        company.id,
        CarbonIntensityMetricType.NumberOfEmployees
      );
      expect(carbonIntensityService.getLatestEstimatedIntensity).toBeCalledWith(
        company.id,
        CarbonIntensityMetricType.UsdOfRevenue
      );
      expect(targetService.findAbsoluteTarget).toBeCalledWith(company.id);
      expect(companySectorService.findMany).toBeCalledWith({
        where: { companyId: company.id },
        relations: ['sector'],
      });
      expect(companyRelationshipService.findActiveRelationship).toBeCalledWith(
        userCompanyId,
        company.id
      );
      expect(companyPrivacyService.hasAccessToCompanyData).toBeCalledWith(
        userCompanyId,
        company.id
      );
      expect(companyPrivacyService.findDataShareRequest).toBeCalledWith(
        userCompanyId,
        company.id
      );
      expect(companyRelationshipService.findPendingInvitation).toBeCalledWith(
        userCompanyId,
        company.id
      );

      expect(result).toEqual({
        id: company.id,
        name: company.name,
        dnbRegion: company.dnbRegion,
        dnbCountryIso: company.dnbCountryIso,
        estimatedNumberOfEmployees: numberOfEmployees.intensityValue,
        estimatedUsdOfRevenue: usdOfRevenue.intensityValue,
        absoluteTargetType: absoluteTarget.privacyType,
        sectors: companySectors.map(
          (companySector) => companySector.sector.name
        ),
        activeRelationship,
        companyPrivacy,
        dataShareRequestSent: Boolean(dataShareRequest),
        duns: company.duns,
        invitationPending: Boolean(pendingInvitation),
        isActive: company.status === CompanyStatus.Active,
        isPublic: hasAccess.hasAccess,
      });
    });
  });
});
