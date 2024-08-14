import DataLoader from 'dataloader';
import { In } from 'typeorm';
import {
  AbsoluteTarget,
  AmbitionPrivacyStatus,
  IntensityTarget,
} from '../../types';
import { getTargetService } from '../../utils/apolloContext';

type BatchEmission = (
  companyIds: readonly string[]
) => Promise<(AmbitionPrivacyStatus | null)[]>;

export const batchTargets: BatchEmission = async (companyIds) => {
  const targetService = getTargetService();

  const absoluteTargets = await targetService.findAbsoluteTargets({
    companyId: In(companyIds as string[]),
  });

  const intensityTargets = await targetService.findIntensityTargets({
    companyId: In(companyIds as string[]),
  });

  const sortedCompanyIds = companyIds.map((id) => {
    const absoluteTarget = absoluteTargets.find((a) => {
      return a.companyId === id;
    });

    const intensityTarget = intensityTargets.find((a) => {
      return a.companyId === id;
    });

    const targets: (AbsoluteTarget | IntensityTarget)[] = [];
    if (absoluteTarget) {
      targets.push(absoluteTarget);
    }
    if (intensityTarget) {
      targets.push(intensityTarget);
    }
    return targetService.getAmbitionPrivacyStatus(targets);
  });
  return sortedCompanyIds;
};

export const ambitionPrivacyStatusLoader = () =>
  new DataLoader<string, AmbitionPrivacyStatus | null>(
    async (keys: readonly string[]) => {
      return batchTargets(keys) as PromiseLike<
        ArrayLike<AmbitionPrivacyStatus | null | Error>
      >;
    }
  );
