import DataLoader from 'dataloader';
import { groupBy } from 'lodash';
import { CompanySectorEntity } from '../entities/CompanySector';

type BatchCompanySectors = (
  companyIds: readonly string[]
) => Promise<CompanySectorEntity[][]>;

export const batchCompanySectors: BatchCompanySectors = async (
  companyIds: readonly string[]
) => {
  const companySectors = await CompanySectorEntity.getRepository()
    .createQueryBuilder('cs')
    .where('cs.companyId IN (:...companyIds)', { companyIds })
    .getMany();

  const companySectorMap: { [key: string]: CompanySectorEntity[] } = groupBy(
    companySectors,
    'companyId'
  );

  return companyIds.map((companyId) => companySectorMap[companyId]);
};

export const companySectorsLoader = () =>
  new DataLoader<string, CompanySectorEntity[]>(
    async (keys: readonly string[]) => batchCompanySectors(keys)
  );
