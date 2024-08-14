import { In, Not } from 'typeorm';
import { v4 } from 'uuid';
import { TargetService } from '.';
import { companyMock } from '../../mocks/company';
import {
  createTargetMock,
  intensityScope3TargetMock,
  intensityTargetMock,
  targetMock,
  targetScope3Mock,
} from '../../mocks/target';
import { TargetRepository } from '../../repositories/TargetRepository';
import {
  AbsoluteTarget,
  AmbitionPrivacyStatus,
  CarbonIntensityMetricType,
  CarbonIntensityType,
  IntensityTarget,
  TargetPrivacyType,
  TargetScopeType,
  TargetType,
} from '../../types';
import { getTargetService } from '../../utils/apolloContext';
import { CompanyPrivacyService } from '../CompanyPrivacyService';
import { CorporateEmissionAccessService } from '../CorporateEmissionAccessService';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('Target Service', () => {
  describe('getAmbitionPrivacyStatus()', () => {
    const absoluteTarget: Partial<AbsoluteTarget> = createTargetMock({
      targetType: TargetType.Absolute,
      privacyType: TargetPrivacyType.Private,
      id: v4(),
      companyId: v4(),
      createdBy: v4(),
      updatedBy: v4(),
    });
    const intensityTarget: Partial<IntensityTarget> = createTargetMock({
      targetType: TargetType.Intensity,
      privacyType: TargetPrivacyType.Private,
      id: v4(),
      companyId: v4(),
      createdBy: v4(),
      updatedBy: v4(),
    });
    it('should return private if both targets are have privacyType private', () => {
      const targetService = getTargetService();

      const ambitionPrivacyStatus = targetService.getAmbitionPrivacyStatus([
        absoluteTarget as AbsoluteTarget,
        intensityTarget as IntensityTarget,
      ]);
      expect(ambitionPrivacyStatus).toEqual(AmbitionPrivacyStatus.NotShared);
    });

    it('should return Shared if one target has privacyType Public', () => {
      const targetService = getTargetService();

      const ambitionPrivacyStatus = targetService.getAmbitionPrivacyStatus([
        absoluteTarget as AbsoluteTarget,
        {
          ...intensityTarget,
          scope3PrivacyType: TargetPrivacyType.Public,
        } as IntensityTarget,
      ]);
      expect(ambitionPrivacyStatus).toEqual(AmbitionPrivacyStatus.Shared);
    });

    it('should return SharedSBTI if one target has privacyType SBTI', () => {
      const targetService = getTargetService();

      const ambitionPrivacyStatus = targetService.getAmbitionPrivacyStatus([
        {
          ...absoluteTarget,
          scope1And2PrivacyType: TargetPrivacyType.ScienceBasedInitiative,
        } as AbsoluteTarget,
        {
          ...intensityTarget,
          scope3PrivacyType: TargetPrivacyType.Public,
        } as IntensityTarget,
      ]);
      expect(ambitionPrivacyStatus).toEqual(AmbitionPrivacyStatus.SharedSbti);
    });
  });
  describe('findAbsoluteTarget', () => {
    it('returns the absolute target of scope 1, 2', async () => {
      const companyId = 'companyId';
      const targetMock = { id: 'targetId' };
      const findOne = jest.fn().mockResolvedValueOnce(targetMock);
      const dbService = ({
        getRepository: jest.fn().mockResolvedValueOnce({
          findOne,
        }),
      } as unknown) as DatabaseService;
      const targetService = new TargetService(
        dbService,
        {} as CompanyPrivacyService,
        {} as CorporateEmissionAccessService
      );
      const target = await targetService.findAbsoluteTarget(companyId);

      expect(dbService.getRepository).toHaveBeenCalledWith(TargetRepository);
      expect(findOne).toHaveBeenCalledWith({
        where: {
          companyId,
          targetType: TargetType.Absolute,
          scopeType: TargetScopeType.Scope_1_2,
        },
      });
      expect(target).toEqual(targetMock);
    });
  });
  describe('findMyTargets', () => {
    it('should return the targets', async () => {
      const targets = [targetMock, targetScope3Mock];
      const intensityTarget = {
        ...intensityTargetMock,
        carbonIntensities: [
          {
            intensityMetric:
              CarbonIntensityMetricType.BusinessTravelPerPassengerKm,
            intensityValue: 1,
          },
        ],
      };
      const intensityTargets = [intensityTarget, intensityScope3TargetMock];
      const targetRepositoryMock = {
        find: jest
          .fn()
          .mockResolvedValueOnce(targets)
          .mockResolvedValueOnce(intensityTargets),
      };
      const hasAccessToCompanyData = jest.fn();
      const companyPrivacyServiceMock = ({
        hasAccessToCompanyData,
      } as unknown) as CompanyPrivacyService;

      const dbService = ({
        getRepository: jest.fn().mockResolvedValue(targetRepositoryMock),
      } as unknown) as DatabaseService;

      const service = new TargetService(
        dbService,
        companyPrivacyServiceMock,
        {} as CorporateEmissionAccessService
      );

      const result = await service.findMyTargets(companyMock.id);

      expect(hasAccessToCompanyData).not.toHaveBeenCalled();
      expect(targetRepositoryMock.find).toHaveBeenCalledTimes(2);
      expect(targetRepositoryMock.find).nthCalledWith(1, {
        where: { companyId: companyMock.id, targetType: TargetType.Absolute },
      });
      expect(targetRepositoryMock.find).nthCalledWith(2, {
        where: {
          companyId: companyMock.id,
          targetType: TargetType.Intensity,
        },
        relations: ['carbonIntensities'],
      });
      expect(result).toEqual({
        absolute: [
          {
            scope1And2Year: targetMock.year,
            scope1And2Reduction: targetMock.reduction,
            scope3Year: targetScope3Mock.year,
            scope3Reduction: targetScope3Mock.reduction,
            strategy: targetMock.strategy,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope1And2PrivacyType: targetMock.privacyType,
            scope3PrivacyType: targetScope3Mock.privacyType,
            companyId: targetMock.companyId,
          },
        ],
        intensity: [
          {
            scope1And2Year: intensityTargetMock.year,
            scope1And2Reduction: intensityTargetMock.reduction,
            scope3Year: intensityScope3TargetMock.year,
            scope3Reduction: intensityScope3TargetMock.reduction,
            strategy: intensityTargetMock.strategy,
            includeCarbonOffset: intensityTargetMock.includeCarbonOffset,
            scope1And2PrivacyType: intensityTargetMock.privacyType,
            scope3PrivacyType: intensityScope3TargetMock.privacyType,
            companyId: intensityTargetMock.companyId,
            intensityMetric:
              intensityTarget.carbonIntensities[0].intensityMetric,
            intensityValue: intensityTarget.carbonIntensities[0].intensityValue,
          },
        ],
      });
    });
  });
  describe('findTargetsByCompanyId', () => {
    it('should return empty when the company has no access to the data', async () => {
      const targetRepositoryMock = {
        find: jest.fn().mockResolvedValueOnce([]),
      };
      const hasAccessToCompanyData = jest.fn().mockResolvedValueOnce(false);
      const companyPrivacyServiceMock = ({
        hasAccessToCompanyData,
      } as unknown) as CompanyPrivacyService;

      const dbService = ({
        getRepository: jest.fn().mockResolvedValue(targetRepositoryMock),
      } as unknown) as DatabaseService;
      const corporateEmissionAccessService = ({
        findMany: jest.fn().mockResolvedValueOnce([]),
      } as unknown) as CorporateEmissionAccessService;

      const service = new TargetService(
        dbService,
        companyPrivacyServiceMock,
        corporateEmissionAccessService
      );

      const result = await service.findTargetsByCompanyId(
        'another_id',
        companyMock.id
      );

      expect(hasAccessToCompanyData).toHaveBeenCalledTimes(1);
      expect(targetRepositoryMock.find).not.toHaveBeenCalled();
      expect(result).toEqual({
        absolute: [],
        intensity: [],
      });
    });
    it('does not return carbon intensities in the intensity targets when the company has no access to it', async () => {
      const carbonIntensityEmissionId = 'emission_id';
      const intensityTarget = {
        ...intensityTargetMock,
        carbonIntensities: [
          {
            intensityMetric:
              CarbonIntensityMetricType.BusinessTravelPerPassengerKm,
            intensityValue: 1,
            emissionId: carbonIntensityEmissionId,
            type: CarbonIntensityType.UserSubmitted,
          },
        ],
      };
      const targetRepositoryMock = {
        find: jest
          .fn()
          .mockResolvedValueOnce([targetMock, targetScope3Mock])
          .mockResolvedValueOnce([intensityTarget, intensityScope3TargetMock]),
      };
      const companyPrivacyServiceMock = ({
        hasAccessToCompanyData: jest
          .fn()
          .mockResolvedValueOnce({ hasAccess: true }),
      } as unknown) as CompanyPrivacyService;

      const dbService = ({
        getRepository: jest.fn().mockResolvedValue(targetRepositoryMock),
      } as unknown) as DatabaseService;
      const corporateEmissionAccessService = ({
        findMany: jest.fn().mockResolvedValueOnce([]),
      } as unknown) as CorporateEmissionAccessService;

      const service = new TargetService(
        dbService,
        companyPrivacyServiceMock,
        corporateEmissionAccessService
      );

      const targetCompanyId = 'another_id';
      const result = await service.findTargetsByCompanyId(
        targetCompanyId,
        companyMock.id
      );

      expect(
        companyPrivacyServiceMock.hasAccessToCompanyData
      ).toHaveBeenCalledTimes(1);
      expect(
        companyPrivacyServiceMock.hasAccessToCompanyData
      ).toHaveBeenCalledWith(companyMock.id, targetCompanyId);
      expect(targetRepositoryMock.find).toHaveBeenCalledTimes(2);
      expect(targetRepositoryMock.find).nthCalledWith(1, {
        where: {
          companyId: targetCompanyId,
          targetType: TargetType.Absolute,
          privacyType: Not([TargetPrivacyType.Private]),
        },
      });
      expect(targetRepositoryMock.find).nthCalledWith(2, {
        where: {
          companyId: targetCompanyId,
          targetType: TargetType.Intensity,
          privacyType: Not([TargetPrivacyType.Private]),
        },
        relations: ['carbonIntensities'],
      });
      expect(corporateEmissionAccessService.findMany).toHaveBeenCalledWith({
        where: {
          emissionId: In([carbonIntensityEmissionId]),
          carbonIntensity: true,
        },
        select: ['emissionId'],
      });
      expect(result).toEqual({
        absolute: [
          {
            scope1And2Year: targetMock.year,
            scope1And2Reduction: targetMock.reduction,
            scope3Year: targetScope3Mock.year,
            scope3Reduction: targetScope3Mock.reduction,
            strategy: targetMock.strategy,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope1And2PrivacyType: targetMock.privacyType,
            scope3PrivacyType: targetScope3Mock.privacyType,
            companyId: targetMock.companyId,
          },
        ],
        intensity: [],
      });
    });
    it('returns carbon intensities in the intensity targets when the company has access to it', async () => {
      const carbonIntensityEmissionId = 'emission_id';
      const intensityTarget = {
        ...intensityTargetMock,
        carbonIntensities: [
          {
            intensityMetric:
              CarbonIntensityMetricType.BusinessTravelPerPassengerKm,
            intensityValue: 1,
            emissionId: carbonIntensityEmissionId,
            type: CarbonIntensityType.UserSubmitted,
          },
        ],
      };
      const targetRepositoryMock = {
        find: jest
          .fn()
          .mockResolvedValueOnce([targetMock, targetScope3Mock])
          .mockResolvedValueOnce([intensityTarget, intensityScope3TargetMock]),
      };
      const companyPrivacyServiceMock = ({
        hasAccessToCompanyData: jest
          .fn()
          .mockResolvedValueOnce({ hasAccess: true }),
      } as unknown) as CompanyPrivacyService;

      const dbService = ({
        getRepository: jest.fn().mockResolvedValue(targetRepositoryMock),
      } as unknown) as DatabaseService;
      const corporateEmissionAccessService = ({
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ emissionId: carbonIntensityEmissionId }]),
      } as unknown) as CorporateEmissionAccessService;

      const service = new TargetService(
        dbService,
        companyPrivacyServiceMock,
        corporateEmissionAccessService
      );

      const targetCompanyId = 'another_id';
      const result = await service.findTargetsByCompanyId(
        targetCompanyId,
        companyMock.id
      );

      expect(
        companyPrivacyServiceMock.hasAccessToCompanyData
      ).toHaveBeenCalledTimes(1);
      expect(
        companyPrivacyServiceMock.hasAccessToCompanyData
      ).toHaveBeenCalledWith(companyMock.id, targetCompanyId);
      expect(targetRepositoryMock.find).toHaveBeenCalledTimes(2);
      expect(targetRepositoryMock.find).nthCalledWith(1, {
        where: {
          companyId: targetCompanyId,
          targetType: TargetType.Absolute,
          privacyType: Not([TargetPrivacyType.Private]),
        },
      });
      expect(targetRepositoryMock.find).nthCalledWith(2, {
        where: {
          companyId: targetCompanyId,
          targetType: TargetType.Intensity,
          privacyType: Not([TargetPrivacyType.Private]),
        },
        relations: ['carbonIntensities'],
      });
      expect(corporateEmissionAccessService.findMany).toHaveBeenCalledWith({
        where: {
          emissionId: In([carbonIntensityEmissionId]),
          carbonIntensity: true,
        },
        select: ['emissionId'],
      });
      expect(result).toEqual({
        absolute: [
          {
            scope1And2Year: targetMock.year,
            scope1And2Reduction: targetMock.reduction,
            scope3Year: targetScope3Mock.year,
            scope3Reduction: targetScope3Mock.reduction,
            strategy: targetMock.strategy,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope1And2PrivacyType: targetMock.privacyType,
            scope3PrivacyType: targetScope3Mock.privacyType,
            companyId: targetMock.companyId,
          },
        ],
        intensity: [
          {
            scope1And2Year: intensityTargetMock.year,
            scope1And2Reduction: intensityTargetMock.reduction,
            scope3Year: intensityScope3TargetMock.year,
            scope3Reduction: intensityScope3TargetMock.reduction,
            strategy: intensityTargetMock.strategy,
            includeCarbonOffset: intensityTargetMock.includeCarbonOffset,
            scope1And2PrivacyType: intensityTargetMock.privacyType,
            scope3PrivacyType: intensityScope3TargetMock.privacyType,
            companyId: intensityTargetMock.companyId,
            intensityMetric:
              intensityTarget.carbonIntensities[0].intensityMetric,
            intensityValue: intensityTarget.carbonIntensities[0].intensityValue,
          },
        ],
      });
    });
  });
});
