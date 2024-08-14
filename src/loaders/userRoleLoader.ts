import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { RoleEntity } from '../entities/Role';
import { UserEntity } from '../entities/User';

type BatchUserRoles = (userIds: readonly string[]) => Promise<RoleEntity[][]>;

export const batchUserRoles: BatchUserRoles = async (userIds) => {
  const users = await UserEntity.getRepository().find({
    where: { id: In([...userIds]) },
    relations: ['roles'],
  });

  const userMap: { [key: string]: RoleEntity[] } = {};

  users.forEach((user) => {
    userMap[user.id] = user.roles ?? [];
  });

  return userIds.map((userId) => userMap[userId]);
};

export const userRoleLoader = () =>
  new DataLoader<string, RoleEntity[]>(async (keys: readonly string[]) =>
    batchUserRoles(keys)
  );
