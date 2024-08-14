import { Job } from 'bull';
import { logger } from '../../utils/logger';

export const handleFailure = (job: Job, err: Error) => {
  const errorData = {
    queue: job.queue.name,
    process: job.name,
    jobId: job.id,
    jobData: job.data,
    error: err.message,
  };
  if (job.opts.attempts) {
    if (job.attemptsMade >= job.opts.attempts) {
      logger.error(errorData, 'Job failures above threshold');
      job.remove();
      return null;
    }

    logger.error(
      {
        ...errorData,
        attemptsLeft: job.opts.attempts - job.attemptsMade,
      },
      'Job failed'
    );
  } else {
    logger.error(errorData, 'Job failed');
  }
};

export const handleCompleted = (job: Job) => {
  logger.info(
    { queue: job.queue.name, process: job.name, jobId: job.id },
    'Job completed'
  );
  job.remove();
};

export const handleStalled = (job: Job) => {
  logger.warn(
    { queue: job.queue.name, process: job.name, jobId: job.id },
    'Job stalled'
  );
};

export const handleError = (error: Error) => {
  logger.error(error, 'Job queue threw an error');
};
