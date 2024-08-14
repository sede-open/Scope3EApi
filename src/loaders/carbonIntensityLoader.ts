import DataLoader from 'dataloader';
import { groupBy } from 'lodash';
import { In } from 'typeorm';
import { CarbonIntensityEntity } from '../entities/CarbonIntensity';
import { CarbonIntensityType } from '../types';

type BatchCarbonIntensities = (
  ids: readonly string[]
) => Promise<CarbonIntensityEntity[][]>;

export const batchCarbonIntensities: BatchCarbonIntensities = async (
  emissionIds
) => {
  const emissionIdsToGet = [...emissionIds];
  const carbonIntensities = await CarbonIntensityEntity.find({
    where: {
      emissionId: In(emissionIdsToGet),
      type: CarbonIntensityType.UserSubmitted,
    },
  });

  const carbonIntensityMap: {
    [key: string]: CarbonIntensityEntity[];
  } = groupBy(carbonIntensities, 'emissionId');

  return emissionIdsToGet.map((id) => carbonIntensityMap[id] ?? []);
};

export const carbonIntensitiesLoader = () =>
  new DataLoader<string, CarbonIntensityEntity[]>((keys: readonly string[]) =>
    batchCarbonIntensities(keys)
  );
