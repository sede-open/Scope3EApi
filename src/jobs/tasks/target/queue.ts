import { JobOptions } from 'bull';
import {
  TARGET_CREATED,
  TARGET_DELETED,
  TARGET_UPDATED,
} from '../../../constants/queue';
import { TargetEntity } from '../../../entities/Target';
import { targetQueue } from '../../queues';
import { getJobOptions } from '../../queues/utils';

export const addJobTargetCreatedToQueue = (
  data: TargetEntity,
  options?: JobOptions
) => {
  return targetQueue.add(TARGET_CREATED, data, getJobOptions(options));
};

export const addJobTargetUpdatedToQueue = (
  data: {
    prev?: TargetEntity;
    updated: TargetEntity;
    updatedColumns?: Array<keyof TargetEntity>;
  },
  options?: JobOptions
) => {
  return targetQueue.add(TARGET_UPDATED, data, getJobOptions(options));
};

export const addJobTargetDeletedToQueue = (
  data: TargetEntity,
  options?: JobOptions
) => {
  return targetQueue.add(TARGET_DELETED, data, getJobOptions(options));
};
