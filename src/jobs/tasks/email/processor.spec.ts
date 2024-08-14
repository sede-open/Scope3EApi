import { Job } from 'bull';
import {
  sendHubspotEmailProcessor,
  sendMulesoftEmailJobProcessor,
} from './processor';
import { mulesoft } from '../../../clients/MulesoftEmailClient';
import { hubspotEmail } from '../../../clients/HubspotEmailClient';
import { logger } from '../../../utils/logger';
import { HubspotTransactionalJobData } from './types';

jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));
jest.mock('../../../clients/MulesoftEmailClient', () => ({
  mulesoft: {
    sendEmail: jest.fn(),
  },
}));
jest.mock('../../../clients/HubspotEmailClient', () => ({
  hubspotEmail: {
    sendTransactionalEmail: jest.fn(),
  },
}));

describe('sendMulesoftEmailJobProcessor', () => {
  const emailJobData = {
    recipient: 'email@test.com',
    subject: 'Hello there',
    body: '<div>Hey</div>',
  };
  const job = ({ data: emailJobData } as unknown) as Job;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call mulesoft', async () => {
    await sendMulesoftEmailJobProcessor(job);
    expect(mulesoft.sendEmail).toHaveBeenCalledWith(emailJobData);
  });

  it('should log an error', async () => {
    const errorMessage = 'Oopsy';
    (mulesoft.sendEmail as jest.Mock).mockRejectedValueOnce(errorMessage);

    expect.assertions(2);

    try {
      await sendMulesoftEmailJobProcessor(job);
    } catch (err) {
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(err.message).toBe(errorMessage);
    }
  });
});

describe('sendHubspotEmailProcessor', () => {
  const job = {
    data: {
      emailId: 1,
      messageBody: {
        to: 'test@test.com',
      },
      customProperties: {},
      contactProperties: {},
    },
  } as Job<HubspotTransactionalJobData>;

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('calls hubspot', async () => {
    await sendHubspotEmailProcessor(job);
    const {
      emailId,
      messageBody,
      customProperties,
      contactProperties,
    } = job.data;
    expect(hubspotEmail.sendTransactionalEmail).toBeCalledWith(
      emailId,
      messageBody,
      contactProperties,
      customProperties
    );
  });
  it('should log an error', async () => {
    const errorMessage = 'Oopsy';
    (hubspotEmail.sendTransactionalEmail as jest.Mock).mockRejectedValueOnce(
      errorMessage
    );

    expect.assertions(2);

    try {
      await sendHubspotEmailProcessor(job);
    } catch (err) {
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(err.message).toBe(errorMessage);
    }
  });
});
