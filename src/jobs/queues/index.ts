import Queue from 'bull';
import {
  COMPANY_QUEUE_NAME,
  COMPANY_RELATIONSHIP_QUEUE_NAME,
  CORPORATE_EMISSION_QUEUE_NAME,
  EMAIL_SEND_QUEUE_NAME,
  EMISSION_ALLOCATION_QUEUE_NAME,
  MAX_EMAILS_JOBS_DURATION,
  MAX_NUMBER_OF_EMAIL_JOBS,
  TARGET_QUEUE_NAME,
  USER_QUEUE_NAME,
} from '../../constants/queue';
import { redisConnectionOptions } from './redisConnection';

const queueDefaults = {
  ...redisConnectionOptions,
  limiter: {
    max: MAX_NUMBER_OF_EMAIL_JOBS,
    duration: MAX_EMAILS_JOBS_DURATION,
  },
  settings: {
    // to prevent problematic jobs from being processed more than once
    maxStalledCount: 1,
  },
};

export const sendEmailQueue = new Queue(EMAIL_SEND_QUEUE_NAME, queueDefaults);

// Company status
export const companyQueue = new Queue(COMPANY_QUEUE_NAME, queueDefaults);

// First customer invited
// First supplier invited
export const companyRelationshipQueue = new Queue(
  COMPANY_RELATIONSHIP_QUEUE_NAME,
  queueDefaults
);

export const userQueue = new Queue(USER_QUEUE_NAME, queueDefaults);

export const corporateEmissionQueue = new Queue(
  CORPORATE_EMISSION_QUEUE_NAME,
  queueDefaults
);

// Ambition (percentage)
export const targetQueue = new Queue(TARGET_QUEUE_NAME, queueDefaults);

// Emissions allocation
export const emissionAllocationQueue = new Queue(
  EMISSION_ALLOCATION_QUEUE_NAME,
  queueDefaults
);
