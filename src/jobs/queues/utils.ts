import { JobOptions } from 'bull';
import { v4 as uuidV4 } from 'uuid';
import { DEFAULT_ATTEMPTS, DEFAULT_TIMEOUT } from '../../constants/queue';

export const getJobOptions = (
  options: Partial<JobOptions> = {}
): JobOptions => {
  return {
    jobId: uuidV4(),
    attempts: DEFAULT_ATTEMPTS,
    timeout: DEFAULT_TIMEOUT,
    ...options,
  };
};
