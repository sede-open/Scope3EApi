import { JobOptions } from 'bull';
import { EMISSION_ALLOCATION_CREATED } from '../../../constants/queue';
import { EmissionAllocationEntity } from '../../../entities/EmissionAllocation';
import { emissionAllocationQueue } from '../../queues';
import { getJobOptions } from '../../queues/utils';

export const addJobEmissionAllocationCreatedToQueue = (
  data: EmissionAllocationEntity,
  options?: JobOptions
) => {
  return emissionAllocationQueue.add(
    EMISSION_ALLOCATION_CREATED,
    data,
    getJobOptions(options)
  );
};
