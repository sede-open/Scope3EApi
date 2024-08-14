import { v4 as uuidV4 } from 'uuid';
import { CorporateEmissionService } from '.';
import { CORPORATE_EMISSION_UPDATED_ACTION } from '../../constants/audit';
import { baselineMock } from '../../mocks/emission';
import { CorporateEmissionRepository } from '../../repositories/CorporateEmissionRepository';
import { CarbonIntensityMetricType, CorporateEmissionType } from '../../types';
import { AuditService } from '../AuditService';
import { CarbonIntensityService } from '../CarbonIntensityService';
import { CompanyPrivacyService } from '../CompanyPrivacyService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { FileService } from '../FileService';

describe('CorporateEmissionService', () => {
  describe('updateEntity()', () => {
    const databaseServiceMock = {
      getEntityManager: () => undefined,
    };
    const autitServiceMock = {
      createEntity: jest.fn(),
      clearEntityManager: jest.fn(),
      objectUpdatesTracker: jest.fn().mockReturnValue({
        updatedEntity: {},
        previousPayload: {},
        currentPayload: {},
      }),
    };
    const fileServiceMock = {
      clearEntityManager: jest.fn(),
      deleteFile: jest.fn(),
    };
    const corporateEmissionService = new CorporateEmissionService(
      (databaseServiceMock as unknown) as DatabaseService,
      (autitServiceMock as unknown) as AuditService,
      (jest.fn() as unknown) as CarbonIntensityService,
      (fileServiceMock as unknown) as FileService,
      (jest.fn() as unknown) as CompanyPrivacyService
    );

    beforeEach(() => {
      fileServiceMock.deleteFile.mockClear();
    });
    describe('when has an existing baseline and file', () => {
      it('should change existing baseline type to actual when updating a new baseline', async () => {
        const findOne = jest.fn();
        const id = uuidV4();
        findOne.mockImplementation(() => {
          return { ...baselineMock, id };
        });
        const findOneOrFail = jest.fn();
        findOneOrFail.mockImplementation(() => {
          return baselineMock;
        });
        const update = jest.fn();
        corporateEmissionService.findOne = findOne;
        corporateEmissionService.findOneOrFail = findOneOrFail;
        corporateEmissionService.update = update;
        await corporateEmissionService.updateEmission(baselineMock);
        expect(corporateEmissionService.update).toHaveBeenCalledTimes(2);
        expect(update).toHaveBeenCalledWith({
          ...baselineMock,
          id,
          type: CorporateEmissionType.Actual,
        });
      });

      it('should delete the old file when a new one is uploaded', async () => {
        const findOneOrFail = jest.fn();
        findOneOrFail.mockImplementation(() => {
          return { ...baselineMock, verificationFileId: '12345' };
        });
        const update = jest.fn();
        corporateEmissionService.findOne = jest.fn();
        corporateEmissionService.findOneOrFail = findOneOrFail;
        corporateEmissionService.update = update;
        await corporateEmissionService.updateEmission(baselineMock);
        expect(fileServiceMock.deleteFile).toHaveBeenCalled();
      });
    });

    it('should update the entity', async () => {
      const updatedAttributes = {
        ...baselineMock,
        scope1: 123,
        scope3: 345,
        headCount: 2,
      };
      const findOneOrFail = jest.fn();
      findOneOrFail.mockImplementation(() => {
        return { ...baselineMock };
      });
      corporateEmissionService.findOne = jest.fn();
      corporateEmissionService.findOneOrFail = findOneOrFail;
      corporateEmissionService.update = jest.fn();
      await corporateEmissionService.updateEmission(updatedAttributes);
      expect(autitServiceMock.createEntity).toBeCalledWith(
        {
          userId: baselineMock.updatedBy,
          action: CORPORATE_EMISSION_UPDATED_ACTION,
        },
        {
          id: baselineMock.id,
        },
        {
          id: baselineMock.id,
        }
      );
    });
  });

  describe('findEmissionsMissingEstimatedUsdOfRevenue()', () => {
    it('calls to get the emissions missing USD_OF_REVENUE estimated intensities', async () => {
      const missingUsdOfRevenue = [{ id: 'missing-usd-of-revenue' }];

      const findEmissionsMissingEstimatedIntensity = jest
        .fn()
        .mockResolvedValueOnce(missingUsdOfRevenue);

      const databaseServiceMock = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          findEmissionsMissingEstimatedIntensity,
        }),
      } as unknown) as DatabaseService;
      const corporateEmissionService = new CorporateEmissionService(
        databaseServiceMock,
        (jest.fn() as unknown) as AuditService,
        (jest.fn() as unknown) as CarbonIntensityService,
        (jest.fn() as unknown) as FileService,
        (jest.fn() as unknown) as CompanyPrivacyService
      );
      const result = await corporateEmissionService.findEmissionsMissingEstimatedUsdOfRevenue();

      expect(findEmissionsMissingEstimatedIntensity).toBeCalledWith(
        CarbonIntensityMetricType.UsdOfRevenue
      );
      expect(result).toEqual(missingUsdOfRevenue);
    });
  });
  describe('findEmissionsMissingEstimatedNumberOfEmployees', () => {
    it('calls to get the emissions missing NUMBER_OF_EMPLOYEES estimated intensities', async () => {
      const missingNumberOfEmployees = [{ id: 'missing-number-of-employees' }];
      const findEmissionsMissingEstimatedIntensity = jest
        .fn()
        .mockResolvedValueOnce(missingNumberOfEmployees);
      const databaseServiceMock = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          findEmissionsMissingEstimatedIntensity,
        }),
      } as unknown) as DatabaseService;
      const corporateEmissionService = new CorporateEmissionService(
        databaseServiceMock,
        (jest.fn() as unknown) as AuditService,
        (jest.fn() as unknown) as CarbonIntensityService,
        (jest.fn() as unknown) as FileService,
        (jest.fn() as unknown) as CompanyPrivacyService
      );

      const result = await corporateEmissionService.findEmissionsMissingEstimatedNumberOfEmployees();

      expect(findEmissionsMissingEstimatedIntensity).toBeCalledWith(
        CarbonIntensityMetricType.NumberOfEmployees
      );
      expect(result).toEqual(missingNumberOfEmployees);
    });
  });
  describe('findEmissionsConsideringAccess', () => {
    it('calls repository if the company has access to the target company data', async () => {
      const companyId = 'company-id';
      const targetCompanyId = 'target-company-id';

      const companyPrivacyService = ({
        hasAccessToCompanyData: jest
          .fn()
          .mockResolvedValueOnce({ hasAccess: true }),
      } as unknown) as CompanyPrivacyService;

      const emissions = [{ id: 'emission-id' }];
      const findEmissionsConsideringAccess = jest
        .fn()
        .mockResolvedValueOnce(emissions);
      const dbService = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          findEmissionsConsideringAccess,
        }),
      } as unknown) as DatabaseService;

      const corporateEmissionService = new CorporateEmissionService(
        dbService,
        (jest.fn() as unknown) as AuditService,
        (jest.fn() as unknown) as CarbonIntensityService,
        (jest.fn() as unknown) as FileService,
        companyPrivacyService
      );
      const result = await corporateEmissionService.findEmissionsConsideringAccess(
        companyId,
        targetCompanyId
      );

      expect(companyPrivacyService.hasAccessToCompanyData).toBeCalledWith(
        companyId,
        targetCompanyId
      );
      expect(dbService.getRepository).toBeCalledWith(
        CorporateEmissionRepository
      );
      expect(findEmissionsConsideringAccess).toBeCalledWith(targetCompanyId);
      expect(result).toEqual(emissions);
    });
    it('does not call repository if the company does not have access to the target company data', async () => {
      const companyId = 'company-id';
      const targetCompanyId = 'target-company-id';

      const companyPrivacyService = ({
        hasAccessToCompanyData: jest.fn().mockResolvedValueOnce(false),
      } as unknown) as CompanyPrivacyService;

      const emissions = [{ id: 'emission-id' }];
      const findEmissionsConsideringAccess = jest
        .fn()
        .mockResolvedValueOnce(emissions);
      const dbService = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          findEmissionsConsideringAccess,
        }),
      } as unknown) as DatabaseService;

      const corporateEmissionService = new CorporateEmissionService(
        dbService,
        (jest.fn() as unknown) as AuditService,
        (jest.fn() as unknown) as CarbonIntensityService,
        (jest.fn() as unknown) as FileService,
        companyPrivacyService
      );
      const result = await corporateEmissionService.findEmissionsConsideringAccess(
        companyId,
        targetCompanyId
      );

      expect(companyPrivacyService.hasAccessToCompanyData).toBeCalledWith(
        companyId,
        targetCompanyId
      );
      expect(dbService.getRepository).not.toBeCalled();
      expect(findEmissionsConsideringAccess).not.toBeCalled();
      expect(result).toEqual([]);
    });
  });
});
