import DataLoader from 'dataloader';
import keyBy from 'lodash/fp/keyBy';
import { RoleEntity } from '../entities/Role';

type BatchRole = (ids: readonly string[]) => Promise<RoleEntity[]>;

export const batchRoles: BatchRole = async (ids) => {
  const idsToGet = [...ids];
  const roles = await RoleEntity.findByIds(idsToGet);

  const roleMap: { [key: string]: RoleEntity } = keyBy('id', roles);

  return idsToGet.map((id) => roleMap[id]);
};

export const roleLoader = () =>
  new DataLoader<string, RoleEntity>((keys: readonly string[]) =>
    batchRoles(keys)
  );
