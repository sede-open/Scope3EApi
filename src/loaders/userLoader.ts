import DataLoader from 'dataloader';
import keyBy from 'lodash/fp/keyBy';
import { UserEntity } from '../entities/User';

type BatchUser = (ids: readonly string[]) => Promise<UserEntity[]>;

export const batchUsers: BatchUser = async (ids) => {
  const idsToGet = [...ids];
  const users = await UserEntity.findByIds(idsToGet);

  const userMap: { [key: string]: UserEntity } = keyBy('id', users);

  return idsToGet.map((id) => userMap[id]);
};

export const userLoader = () =>
  new DataLoader<string, UserEntity>((keys: readonly string[]) =>
    batchUsers(keys)
  );
