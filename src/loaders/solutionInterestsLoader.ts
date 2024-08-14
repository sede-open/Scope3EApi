import DataLoader from 'dataloader';
import keyBy from 'lodash/fp/keyBy';
import { SolutionInterestsEntity } from '../entities/SolutionInterests';

type BatchSolutionInterests = (
  ids: readonly string[]
) => Promise<SolutionInterestsEntity[]>;

export const batchSolutionInterests: BatchSolutionInterests = async (ids) => {
  const idsToGet = [...ids];
  const solutionInterests = await SolutionInterestsEntity.findByIds(idsToGet);

  const solutionInterestsMap: {
    [key: string]: SolutionInterestsEntity;
  } = keyBy('id', solutionInterests);

  return idsToGet.map((id) => solutionInterestsMap[id]);
};

export const solutionInterestsLoader = () =>
  new DataLoader<string, SolutionInterestsEntity>((keys: readonly string[]) =>
    batchSolutionInterests(keys)
  );
