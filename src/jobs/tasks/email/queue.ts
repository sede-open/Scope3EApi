import { sendEmailQueue } from '../../queues';
import {
  SEND_MULESOFT_EMAIL_PROCESSOR,
  SEND_HUBSPOT_EMAIL_PROCESSOR,
} from '../../../constants/queue';
import { EmailJobDataType, HubspotTransactionalJobData } from './types';
import { getJobOptions } from '../../queues/utils';

export const addJobSendEmailToQueue = (emailJobData: EmailJobDataType) => {
  return sendEmailQueue.add(
    SEND_MULESOFT_EMAIL_PROCESSOR,
    emailJobData,
    getJobOptions()
  );
};

export const addJobSendHubspotEmailToQueue = <CustomProperties>(
  data: HubspotTransactionalJobData<CustomProperties>
) => {
  return sendEmailQueue.add(
    SEND_HUBSPOT_EMAIL_PROCESSOR,
    data,
    getJobOptions()
  );
};
