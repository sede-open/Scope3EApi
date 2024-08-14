import { JobOptions } from 'bull';
import {
  CORPORATE_EMISSION_CREATED,
  CORPORATE_EMISSION_DELETED,
  CORPORATE_EMISSION_UPDATED,
} from '../../../constants/queue';
import { CorporateEmissionEntity } from '../../../entities/CorporateEmission';
import { corporateEmissionQueue } from '../../queues';
import { getJobOptions } from '../../queues/utils';

export const addJobCorporateEmissionCreatedToQueue = (
  data: CorporateEmissionEntity,
  options?: JobOptions
) => {
  return corporateEmissionQueue.add(
    CORPORATE_EMISSION_CREATED,
    data,
    getJobOptions(options)
  );
};

export const addJobCorporateEmissionUpdatedToQueue = (
  data: {
    prev?: CorporateEmissionEntity;
    updated: CorporateEmissionEntity;
    updatedColumns?: Array<keyof CorporateEmissionEntity>;
  },
  options?: JobOptions
) => {
  return corporateEmissionQueue.add(
    CORPORATE_EMISSION_UPDATED,
    data,
    getJobOptions(options)
  );
};
export const addJobCorporateEmissionDeletedToQueue = (
  data: CorporateEmissionEntity,
  options?: JobOptions
) => {
  return corporateEmissionQueue.add(
    CORPORATE_EMISSION_DELETED,
    data,
    getJobOptions(options)
  );
};
