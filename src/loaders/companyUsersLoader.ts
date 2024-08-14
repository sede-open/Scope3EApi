import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { UserEntity } from '../entities/User';

type BatchCompanyUsers = (
  companyIds: readonly string[]
) => Promise<UserEntity[][]>;

export const batchCompanyUsers: BatchCompanyUsers = async (companyIds) => {
  const idsToGet = [...companyIds];

  const users = await UserEntity.find({
    where: { companyId: In(idsToGet), isDeleted: false },
  });

  const usersGroupedByCompany = companyIds.map((companyId) => {
    return users.filter((user) => user.companyId == companyId);
  });

  return usersGroupedByCompany;
};

export const companyUsersLoader = () =>
  new DataLoader<string, UserEntity[]>((keys: readonly string[]) =>
    batchCompanyUsers(keys)
  );
