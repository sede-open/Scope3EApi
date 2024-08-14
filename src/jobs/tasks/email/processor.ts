import { Job } from 'bull';

import { EmailJobDataType, HubspotTransactionalJobData } from './types';
import { mulesoft } from '../../../clients/MulesoftEmailClient';
import { hubspotEmail } from '../../../clients/HubspotEmailClient';
import { logger } from '../../../utils/logger';

export const sendMulesoftEmailJobProcessor = async ({
  data: { body, recipient, subject },
}: Job<EmailJobDataType>) => {
  try {
    await mulesoft.sendEmail({
      body,
      recipient,
      subject,
    });
  } catch (err) {
    logger.error(err, 'Unable to process email');
    throw Error(err);
  }
};

export const sendHubspotEmailProcessor = async ({
  data: { emailId, messageBody, customProperties, contactProperties },
}: Job<HubspotTransactionalJobData>) => {
  try {
    await hubspotEmail.sendTransactionalEmail(
      emailId,
      messageBody,
      contactProperties,
      customProperties
    );
  } catch (err) {
    logger.error(err, 'Unable to process HubSpot transactional email');
    throw new Error(err);
  }
};
