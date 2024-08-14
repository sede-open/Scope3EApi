import { FindConditions, In, Not } from 'typeorm';
import {
  mergeTargetData,
  pairTargets,
  targetPairsToIntensityTargetData,
} from '../../controllers/TargetController/utils';
import { TargetEntity } from '../../entities/Target';
import { TargetRepository } from '../../repositories/TargetRepository';
import {
  AbsoluteTarget,
  AmbitionPrivacyStatus,
  CarbonIntensityType,
  IntensityTarget,
  TargetPrivacyType,
  TargetScopeType,
  TargetType,
} from '../../types';
import { BaseService } from '../BaseService';
import { CompanyPrivacyService } from '../CompanyPrivacyService';
import { CorporateEmissionAccessService } from '../CorporateEmissionAccessService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { ITarget } from './types';

export class TargetService extends BaseService<TargetEntity, ITarget> {
  constructor(
    databaseService: DatabaseService,
    private companyPrivacyService: CompanyPrivacyService,
    private corporateEmissionAccessService: CorporateEmissionAccessService
  ) {
    super(databaseService, TargetRepository);
  }

  async findAbsoluteTarget(companyId: string) {
    const targetRepo = await this.databaseService.getRepository(
      TargetRepository
    );

    return targetRepo.findOne({
      where: {
        companyId,
        targetType: TargetType.Absolute,
        scopeType: TargetScopeType.Scope_1_2,
      },
    });
  }

  async findAbsoluteTargets(
    findConditions?: FindConditions<TargetEntity>
  ): Promise<AbsoluteTarget[]> {
    const targetRepo = await this.databaseService.getRepository(
      TargetRepository
    );
    const absoluteTargets = await targetRepo.find({
      where: { ...findConditions, targetType: TargetType.Absolute },
    });
    if (absoluteTargets.length === 0) {
      return [];
    }
    const absolute = pairTargets(absoluteTargets).map((data) =>
      mergeTargetData(data)
    );
    return absolute;
  }

  async findIntensityTargets(
    findConditions?: FindConditions<TargetEntity>
  ): Promise<IntensityTarget[]> {
    const targetRepo = await this.databaseService.getRepository(
      TargetRepository
    );
    const intensityTargets = await targetRepo.find({
      where: { ...findConditions, targetType: TargetType.Intensity },
      relations: ['carbonIntensities'],
    });

    if (intensityTargets.length === 0) {
      return [];
    }
    const intensity = pairTargets(intensityTargets).reduce(
      targetPairsToIntensityTargetData,
      []
    );
    return intensity;
  }

  private targetHasPrivacyType(
    target: AbsoluteTarget | IntensityTarget,
    privacyType: TargetPrivacyType
  ) {
    return (
      target.scope1And2PrivacyType === privacyType ||
      target.scope3PrivacyType === privacyType
    );
  }

  getAmbitionPrivacyStatus(targets: (AbsoluteTarget | IntensityTarget)[]) {
    const isSharedViaScienceBasedInitiative = targets.some((target) =>
      this.targetHasPrivacyType(
        target,
        TargetPrivacyType.ScienceBasedInitiative
      )
    )
      ? AmbitionPrivacyStatus.SharedSbti
      : undefined;

    if (isSharedViaScienceBasedInitiative)
      return isSharedViaScienceBasedInitiative;

    const isPublic = targets.some((target) =>
      this.targetHasPrivacyType(target, TargetPrivacyType.Public)
    )
      ? AmbitionPrivacyStatus.Shared
      : undefined;

    if (isPublic) return isPublic;

    return AmbitionPrivacyStatus.NotShared;
  }

  findMyTargets = async (userCompanyId: string) => {
    const targetRepository = await this.databaseService.getRepository(
      TargetRepository
    );
    const [absoluteTargets, intensityTargets] = await Promise.all([
      targetRepository.find({
        where: { companyId: userCompanyId, targetType: TargetType.Absolute },
      }),
      targetRepository.find({
        where: { companyId: userCompanyId, targetType: TargetType.Intensity },
        relations: ['carbonIntensities'],
      }),
    ]);
    return {
      absolute: pairTargets(absoluteTargets).map(mergeTargetData),
      intensity: pairTargets(intensityTargets).reduce(
        targetPairsToIntensityTargetData,
        []
      ),
    };
  };

  findTargetsByCompanyId = async (companyId: string, userCompanyId: string) => {
    const targetRepository = await this.databaseService.getRepository(
      TargetRepository
    );
    const {
      hasAccess,
    } = await this.companyPrivacyService.hasAccessToCompanyData(
      userCompanyId,
      companyId
    );
    if (!hasAccess) {
      return {
        absolute: [],
        intensity: [],
      };
    }

    const [absoluteTargets, intensityTargets] = await Promise.all([
      targetRepository.find({
        where: {
          companyId,
          targetType: TargetType.Absolute,
          privacyType: Not([TargetPrivacyType.Private]),
        },
      }),
      targetRepository.find({
        where: {
          companyId,
          targetType: TargetType.Intensity,
          privacyType: Not([TargetPrivacyType.Private]),
        },
        relations: ['carbonIntensities'],
      }),
    ]);

    let hasUserSubmittedIntensity = false;
    for (const target of intensityTargets) {
      if (target.carbonIntensities?.length) {
        const found = target.carbonIntensities.find(
          (intensity) => intensity.type === CarbonIntensityType.UserSubmitted
        );
        if (found) {
          hasUserSubmittedIntensity = true;
          break;
        }
      }
    }
    // has no submitted intensity, leave only the estimated
    if (!hasUserSubmittedIntensity) {
      intensityTargets.forEach((target) => {
        if (target.carbonIntensities?.length) {
          target.carbonIntensities = target.carbonIntensities.filter(
            (intensity) => intensity.type === CarbonIntensityType.Estimated
          );
        }
      });
    } else {
      const emissionIds = intensityTargets[0]?.carbonIntensities
        ?.filter(
          (intensity) => intensity.type === CarbonIntensityType.UserSubmitted
        )
        .map(({ emissionId }) => emissionId);
      if (emissionIds?.length) {
        const emissionIdsGivingAccess = await this.corporateEmissionAccessService.findMany(
          {
            where: { emissionId: In(emissionIds), carbonIntensity: true },
            select: ['emissionId'],
          }
        );
        intensityTargets.forEach((target) => {
          if (target.carbonIntensities?.length) {
            target.carbonIntensities = target.carbonIntensities.filter(
              ({ emissionId }) => {
                return emissionIdsGivingAccess.find(
                  ({ emissionId: id }) => id === emissionId
                );
              }
            );
          }
        });
      }
    }

    return {
      absolute: pairTargets(absoluteTargets).map(mergeTargetData),
      intensity: pairTargets(intensityTargets).reduce(
        targetPairsToIntensityTargetData,
        []
      ),
    };
  };
}
