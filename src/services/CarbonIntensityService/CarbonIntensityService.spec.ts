import { CarbonIntensityService } from '.';
import { createCarbonIntensityMock } from '../../mocks/carbonIntensities';
import { CarbonIntensityRepository } from '../../repositories/CarbonIntensityRepository';
import { EmissionMissingIntensity } from '../../repositories/CorporateEmissionRepository/types';
import { CarbonIntensityMetricType, CarbonIntensityType } from '../../types';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { DnBService } from '../DnBService';

describe('Carbon Intensity Service', () => {
  describe('update()', () => {
    it('should update carbon intensity', async () => {
      const carbonIntensityService = new CarbonIntensityService(
        (jest.fn() as unknown) as DatabaseService,
        (jest.fn as unknown) as DnBService
      );
      const save = jest.fn();
      carbonIntensityService.getRepository = () =>
        (({
          save,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown) as any);
      carbonIntensityService.deleteCarbonIntensity = jest.fn();
      const userId = 'userId';
      const {
        companyId,
        emissionId,
        year,
        intensityMetric,
        intensityValue,
        updatedBy,
        createdBy,
      } = createCarbonIntensityMock({
        id: 'id',
        companyId: 'companyid',
        emissionId: 'customer',
        createdBy: userId,
        updatedBy: userId,
        intensityMetric: CarbonIntensityMetricType.LitrePacked,
        intensityValue: 8000,
      });
      const carbonIntensities = [
        {
          type: intensityMetric,
          value: intensityValue,
        },
      ];
      await carbonIntensityService.updateCarbonIntensity({
        companyId,
        year,
        userId,
        emissionId,
        carbonIntensities,
      });

      expect(save).toHaveBeenCalledWith([
        {
          companyId,
          createdBy,
          emissionId,
          intensityMetric,
          intensityValue,
          updatedBy,
          year,
        },
      ]);
      expect(carbonIntensityService.deleteCarbonIntensity).toHaveBeenCalledWith(
        {
          companyId,
          emissionId,
          year,
        }
      );
    });
  });

  describe('createUsdOfRevenueEstimatedIntensities', () => {
    describe('when the company does not have duns id', () => {
      it('skips creating an estimated intensity', async () => {
        const save = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            save,
          }),
        } as unknown) as DatabaseService;
        const dnbService = ({
          companyByDuns: jest.fn(),
        } as unknown) as DnBService;

        const corporateEmissions = ([
          { duns: undefined },
        ] as unknown) as EmissionMissingIntensity[];

        const carbonIntensityService = new CarbonIntensityService(
          dbService,
          dnbService
        );
        await carbonIntensityService.createUsdOfRevenueEstimatedIntensities(
          corporateEmissions
        );

        expect(dbService.getRepository).toBeCalledWith(
          CarbonIntensityRepository
        );
        expect(dnbService.companyByDuns).not.toBeCalled();
        expect(save).toBeCalledWith([]);
      });
    });
    describe('when D&B does not have an estimated value', () => {
      it('skips creating an estimated intensity', async () => {
        const save = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            save,
          }),
        } as unknown) as DatabaseService;

        const dnbService = ({
          companyByDuns: jest.fn().mockResolvedValueOnce({
            usdOfRevenue: undefined,
          }),
        } as unknown) as DnBService;

        const dunsId = 'DUNS_ID';
        const corporateEmissions = ([
          { duns: dunsId },
        ] as unknown) as EmissionMissingIntensity[];

        const carbonIntensityService = new CarbonIntensityService(
          dbService,
          dnbService
        );
        await carbonIntensityService.createUsdOfRevenueEstimatedIntensities(
          corporateEmissions
        );

        expect(dbService.getRepository).toBeCalledWith(
          CarbonIntensityRepository
        );
        expect(dnbService.companyByDuns).toBeCalledWith(dunsId);
        expect(save).toBeCalledWith([]);
      });
    });
    describe('when D&B has an estimated value', () => {
      it(`fetches the estimated value and creates ${CarbonIntensityMetricType.UsdOfRevenue} estimated intensity`, async () => {
        const save = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            save,
          }),
        } as unknown) as DatabaseService;

        const usdOfRevenue = 1000;
        const dnbService = ({
          companyByDuns: jest.fn().mockResolvedValueOnce({
            usdOfRevenue,
          }),
        } as unknown) as DnBService;

        const corporateEmission = {
          emissionId: 'EMISSION_ID',
          emissionYear: 2021,
          companyId: 'COMPANY_ID',
          companyName: 'COMPANY_NAME',
          duns: 'DUNS_ID',
        };
        const corporateEmissions = ([
          corporateEmission,
        ] as unknown) as EmissionMissingIntensity[];

        const carbonIntensityService = new CarbonIntensityService(
          dbService,
          dnbService
        );
        await carbonIntensityService.createUsdOfRevenueEstimatedIntensities(
          corporateEmissions
        );

        expect(dbService.getRepository).toBeCalledWith(
          CarbonIntensityRepository
        );
        expect(dnbService.companyByDuns).toBeCalledWith(corporateEmission.duns);
        expect(save).toBeCalledWith([
          {
            companyId: corporateEmission.companyId,
            year: corporateEmission.emissionYear,
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityValue: usdOfRevenue,
            emissionId: corporateEmission.emissionId,
            type: CarbonIntensityType.Estimated,
          },
        ]);
      });
    });
  });
  describe('createNumberOfEmployeesEstimatedIntensities', () => {
    describe('when the company does not have duns id', () => {
      it('skips creating an estimated intensity', async () => {
        const save = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            save,
          }),
        } as unknown) as DatabaseService;
        const dnbService = ({
          companyByDuns: jest.fn(),
        } as unknown) as DnBService;

        const corporateEmissions = ([
          { duns: undefined },
        ] as unknown) as EmissionMissingIntensity[];

        const carbonIntensityService = new CarbonIntensityService(
          dbService,
          dnbService
        );
        await carbonIntensityService.createNumberOfEmployeesEstimatedIntensities(
          corporateEmissions
        );

        expect(dbService.getRepository).toBeCalledWith(
          CarbonIntensityRepository
        );
        expect(dnbService.companyByDuns).not.toBeCalled();
        expect(save).toBeCalledWith([]);
      });
    });
    describe('when D&B does not have an estimated value', () => {
      it('skips creating an estimated intensity', async () => {
        const save = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            save,
          }),
        } as unknown) as DatabaseService;

        const dnbService = ({
          companyByDuns: jest.fn().mockResolvedValueOnce({
            numberOfEmployees: undefined,
          }),
        } as unknown) as DnBService;

        const dunsId = 'DUNS_ID';
        const corporateEmissions = ([
          { duns: dunsId },
        ] as unknown) as EmissionMissingIntensity[];

        const carbonIntensityService = new CarbonIntensityService(
          dbService,
          dnbService
        );
        await carbonIntensityService.createNumberOfEmployeesEstimatedIntensities(
          corporateEmissions
        );

        expect(dbService.getRepository).toBeCalledWith(
          CarbonIntensityRepository
        );
        expect(dnbService.companyByDuns).toBeCalledWith(dunsId);
        expect(save).toBeCalledWith([]);
      });
    });
    describe('when D&B has an estimated value', () => {
      it(`fetches the estimated value and creates ${CarbonIntensityMetricType.NumberOfEmployees} estimated intensity`, async () => {
        const save = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            save,
          }),
        } as unknown) as DatabaseService;

        const numberOfEmployees = 600;
        const dnbService = ({
          companyByDuns: jest.fn().mockResolvedValueOnce({
            numberOfEmployees,
          }),
        } as unknown) as DnBService;

        const corporateEmission = {
          emissionId: 'EMISSION_ID',
          emissionYear: 2021,
          companyId: 'COMPANY_ID',
          companyName: 'COMPANY_NAME',
          duns: 'DUNS_ID',
        };
        const corporateEmissions = ([
          corporateEmission,
        ] as unknown) as EmissionMissingIntensity[];

        const carbonIntensityService = new CarbonIntensityService(
          dbService,
          dnbService
        );
        await carbonIntensityService.createNumberOfEmployeesEstimatedIntensities(
          corporateEmissions
        );

        expect(dbService.getRepository).toBeCalledWith(
          CarbonIntensityRepository
        );
        expect(dnbService.companyByDuns).toBeCalledWith(corporateEmission.duns);
        expect(save).toBeCalledWith([
          {
            companyId: corporateEmission.companyId,
            year: corporateEmission.emissionYear,
            intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
            intensityValue: numberOfEmployees,
            emissionId: corporateEmission.emissionId,
            type: CarbonIntensityType.Estimated,
          },
        ]);
      });
    });
  });
  describe('getLatestEstimatedIntensity', () => {
    it('returns the latest estimated intensity', async () => {
      const latestCarbonIntensity = { id: 'intensity-id' };
      const companyId = 'COMPANY_ID';
      const estimatedCarbonIntensity = CarbonIntensityMetricType.UsdOfRevenue;

      const find = jest.fn().mockResolvedValueOnce([latestCarbonIntensity]);
      const dbService = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          find,
        }),
      } as unknown) as DatabaseService;

      const carbonIntensityService = new CarbonIntensityService(
        dbService,
        {} as DnBService
      );
      const result = await carbonIntensityService.getLatestEstimatedIntensity(
        companyId,
        estimatedCarbonIntensity
      );

      expect(find).toBeCalledWith({
        where: {
          companyId,
          intensityMetric: estimatedCarbonIntensity,
          type: CarbonIntensityType.Estimated,
        },
        order: { year: 'DESC' },
        take: 1,
      });
      expect(result).toEqual(latestCarbonIntensity);
    });
    it('returns undefined if there is no latest estimated intensity', async () => {
      const companyId = 'COMPANY_ID';
      const estimatedCarbonIntensity = CarbonIntensityMetricType.UsdOfRevenue;

      const find = jest.fn().mockResolvedValueOnce([]);
      const dbService = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          find,
        }),
      } as unknown) as DatabaseService;

      const carbonIntensityService = new CarbonIntensityService(
        dbService,
        {} as DnBService
      );
      const result = await carbonIntensityService.getLatestEstimatedIntensity(
        companyId,
        estimatedCarbonIntensity
      );

      expect(find).toBeCalledWith({
        where: {
          companyId,
          intensityMetric: estimatedCarbonIntensity,
          type: CarbonIntensityType.Estimated,
        },
        order: { year: 'DESC' },
        take: 1,
      });
      expect(result).toBeUndefined();
    });
  });
});
