import DataLoader from 'dataloader';
import keyBy from 'lodash/fp/keyBy';
import { CompanyEntity } from '../entities/Company';

type BatchCompany = (ids: readonly string[]) => Promise<CompanyEntity[]>;

const MAX_BATCH_SIZE = 2000; // Set a maximum batch size that the server can handle

export const batchCompanies: BatchCompany = async (ids) => {
  const companies: CompanyEntity[] = [];
  const totalIds = ids.length;
  let currentIndex = 0;

  // Load companies in smaller batches
  while (currentIndex < totalIds) {
    const batchIds = ids.slice(currentIndex, currentIndex + MAX_BATCH_SIZE);
    const batchCompanies = await CompanyEntity.findByIds(batchIds);
    companies.push(...batchCompanies);
    currentIndex += MAX_BATCH_SIZE;
  }

  const companyMap: { [key: string]: CompanyEntity } = keyBy('id', companies);
  console.log('Length of ids' + ':' + totalIds);
  console.log('Value of Company Map' + ':' + companyMap);
  return ids.map((id) => companyMap[id]);
};

export const companyLoader = () =>
  new DataLoader<string, CompanyEntity>(
    (keys: readonly string[]) => batchCompanies(keys),
    { maxBatchSize: MAX_BATCH_SIZE }
  );
