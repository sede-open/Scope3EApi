import { JobOptions } from 'bull';
import { COMPANY_RELATIONSHIP_CREATED } from '../../../constants/queue';
import { CompanyRelationshipEntity } from '../../../entities/CompanyRelationship';
import { companyRelationshipQueue } from '../../queues';
import { getJobOptions } from '../../queues/utils';

export const addJobCompanyRelationshipCreatedToQueue = (
  data: CompanyRelationshipEntity,
  options?: JobOptions
) => {
  return companyRelationshipQueue.add(
    COMPANY_RELATIONSHIP_CREATED,
    data,
    getJobOptions(options)
  );
};
