import { Job } from 'bull';

import {
  handleFailure,
  handleCompleted,
  handleStalled,
} from './statusHandlers';
import { logger } from '../../utils/logger';
import {
  EMAIL_SEND_QUEUE_NAME,
  SEND_HUBSPOT_EMAIL_PROCESSOR,
} from '../../constants/queue';

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('jobs handlers', () => {
  const emailJobData = {
    recipient: 'email@test.com',
    subject: 'Hello there',
    body: '<div>Hey</div>',
  };

  describe('handleFailure', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should remove job once the amount of retries has been reached', () => {
      const removeMock = jest.fn();
      const job = ({
        id: '12334',
        opts: { attempts: 3 },
        attemptsMade: 3,
        name: SEND_HUBSPOT_EMAIL_PROCESSOR,
        queue: { name: EMAIL_SEND_QUEUE_NAME },
        data: emailJobData,
        remove: removeMock,
      } as unknown) as Job;
      const error = new Error('Oopsy daisy');

      handleFailure(job, error);

      const [
        [loggerData, loggerMessage],
      ] = (logger.error as jest.Mock).mock.calls;

      expect(loggerMessage).toContain('Job failures above threshold');
      expect(loggerData).toMatchObject({
        queue: job.queue.name,
        process: job.name,
        jobId: job.id,
        jobData: job.data,
        error: error.message,
      });
      expect(removeMock).toHaveBeenCalled();
    });

    it('should log when the job fails within retries number', () => {
      const removeMock = jest.fn();
      const job = ({
        id: '12334',
        opts: { attempts: 3 },
        attemptsMade: 1,
        queue: { name: EMAIL_SEND_QUEUE_NAME },
        data: emailJobData,
        remove: removeMock,
      } as unknown) as Job;
      const error = new Error('Oopsy daisy');

      handleFailure(job, error);

      const [
        [loggerData, loggerMessage],
      ] = (logger.error as jest.Mock).mock.calls;
      expect(loggerMessage).toContain('Job failed');
      expect(loggerData).toMatchObject({
        queue: job.queue.name,
        process: job.name,
        jobId: job.id,
        jobData: job.data,
        error: error.message,
        attemptsLeft: 2,
      });
      expect(removeMock).not.toHaveBeenCalled();
    });

    it('should log when the job fails without any tries', () => {
      const removeMock = jest.fn();
      const job = ({
        id: '12334',
        opts: { attempts: 3 },
        queue: { name: EMAIL_SEND_QUEUE_NAME },
        data: emailJobData,
        remove: removeMock,
      } as unknown) as Job;
      const errorMessage = 'Oopsy daisy';
      const error = new Error(errorMessage);

      handleFailure(job, error);

      const [
        [loggerData, loggerMessage],
      ] = (logger.error as jest.Mock).mock.calls;
      expect(loggerMessage).toContain('Job failed');
      expect(loggerData).toMatchObject({
        queue: job.queue.name,
        process: job.name,
        jobId: job.id,
        jobData: job.data,
        error: error.message,
      });
      expect(removeMock).not.toHaveBeenCalled();
    });
  });

  describe('handleCompleted', () => {
    it('should remove job', () => {
      const removeMock = jest.fn();
      const job = ({
        id: '12334',
        opts: { attempts: 3 },
        queue: { name: EMAIL_SEND_QUEUE_NAME },
        data: emailJobData,
        remove: removeMock,
      } as unknown) as Job;

      handleCompleted(job);

      const [
        [loggerData, loggerMessage],
      ] = (logger.info as jest.Mock).mock.calls;
      expect(loggerMessage).toContain('Job completed');
      expect(loggerData).toMatchObject({
        queue: job.queue.name,
        process: job.name,
        jobId: job.id,
      });
      expect(removeMock).toHaveBeenCalled();
    });
  });

  describe('handleStalled', () => {
    it('should log that job has stalled', () => {
      const job = ({
        id: '12334',
        queue: { name: EMAIL_SEND_QUEUE_NAME },
        data: emailJobData,
      } as unknown) as Job;

      handleStalled(job);

      const [
        [loggerData, loggerMessage],
      ] = (logger.warn as jest.Mock).mock.calls;
      expect(loggerMessage).toContain('Job stalled');
      expect(loggerData).toMatchObject({
        queue: job.queue.name,
        process: job.name,
        jobId: job.id,
      });
    });
  });
});
