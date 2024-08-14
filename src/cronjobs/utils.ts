import { SlackClient } from '../clients/SlackClient';
import { getConfig } from '../config';
import { logger } from '../utils/logger';

export const alertJobStart = async (jobName: string, channelId: string) => {
  const {
    slack: { token },
  } = getConfig();

  const slackClient = new SlackClient(token);

  await slackClient.postMessage(
    `:steam_locomotive: Starting "${jobName}" Job`,
    channelId
  );
};

export const alertJobSuccess = async (jobName: string, channelId: string) => {
  const {
    slack: { token },
  } = getConfig();

  const slackClient = new SlackClient(token);

  await slackClient.postMessage(
    `:checkered_flag: :white_check_mark: "${jobName}" Job ran successfully`,
    channelId
  );
};

export const alertJobFail = async (
  jobName: string,
  error: string,
  channelId: string
) => {
  const {
    slack: { token },
  } = getConfig();

  const slackClient = new SlackClient(token);

  await slackClient.postMessage(
    `:x: "${jobName}" Job failed to run -- error message: ${error}`,
    channelId
  );
};

export const runCronJob = async (
  cb: () => Promise<void>,
  jobName: string,
  channelId: string
) => {
  if (jobName) {
    await alertJobStart(jobName, channelId);
  }
  return cb()
    .then(async () => {
      logger.info('Completed');
      await alertJobSuccess(jobName, channelId);
      process.exit(0);
    })
    .catch(async (error) => {
      logger.error('Job failed');
      logger.error(error);
      await alertJobFail(jobName, error.message, channelId);
      process.exit(1);
    });
};
