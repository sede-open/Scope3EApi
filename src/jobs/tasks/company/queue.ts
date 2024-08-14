import { JobOptions } from 'bull';
import { COMPANY_CREATED, COMPANY_UPDATED } from '../../../constants/queue';
import { CompanyEntity } from '../../../entities/Company';
import { companyQueue } from '../../queues';
import { getJobOptions } from '../../queues/utils';

export const addJobCompanyCreatedToQueue = (
  data: CompanyEntity,
  options?: JobOptions
) => {
  return companyQueue.add(COMPANY_CREATED, data, getJobOptions(options));
};

export const addJobCompanyUpdatedToQueue = (
  data: {
    prev?: CompanyEntity;
    updated: CompanyEntity;
    updatedColumns?: Array<keyof CompanyEntity>;
  },
  options?: JobOptions
) => {
  return companyQueue.add(COMPANY_UPDATED, data, getJobOptions(options));
};
