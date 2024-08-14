import { v4 as uuidV4 } from 'uuid';
import {
  USER_CREATED,
  USER_UPDATED,
  DEFAULT_ATTEMPTS,
  DEFAULT_TIMEOUT,
  USER_DELETED,
  HUBSPOT_CONTACT_CREATED,
} from '../../../constants/queue';
import { UserEntity } from '../../../entities/User';
import { HubspotObject } from '../../../clients/HubspotClient/types';
import { userQueue } from '../../queues';
import { JobOptions } from 'bull';
import { getJobOptions } from '../../queues/utils';

export const addJobUserCreatedToQueue = (
  data: {
    user: UserEntity;
    inviter?: UserEntity;
    inviteLink?: string;
  },
  options: JobOptions = {}
) => {
  return userQueue.add(USER_CREATED, data, {
    jobId: uuidV4(),
    attempts: DEFAULT_ATTEMPTS,
    timeout: DEFAULT_TIMEOUT,
    ...options,
  });
};

export const addJobUserUpdatedToQueue = (
  data: {
    prev?: UserEntity;
    updated: UserEntity;
    updatedColumns?: Array<keyof UserEntity>;
  },
  options?: JobOptions
) => {
  if (data.updatedColumns && !data.updatedColumns.length) {
    return;
  }

  return userQueue.add(USER_UPDATED, data, getJobOptions(options));
};

// Soft deletes
export const addJobUserDeletedToQueue = (
  data: UserEntity,
  options?: JobOptions
) => {
  return userQueue.add(USER_DELETED, data, getJobOptions(options));
};

export const addJobHubspotContactCreatedToQueue = (
  data: {
    contact: HubspotObject;
    companyId: string;
  },
  options?: JobOptions
) => {
  return userQueue.add(HUBSPOT_CONTACT_CREATED, data, getJobOptions(options));
};
