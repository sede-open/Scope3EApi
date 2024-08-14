import { alertJobFail, alertJobStart, alertJobSuccess } from './utils';

const postMessage = jest.fn();

const jobName = 'test-job';
const channelId = 'xxx-yyy';
const errorMessage = 'Something failed';

jest.mock('../clients/SlackClient', () => {
  return {
    SlackClient: jest.fn().mockImplementation(() => ({
      postMessage,
    })),
  };
});

describe('cronjob utils', () => {
  beforeEach(() => {
    postMessage.mockReset();
  });

  describe('alertJobStart', () => {
    it('should post a slack message with the channel ID and content', async () => {
      await alertJobStart(jobName, channelId);

      expect(postMessage).toHaveBeenCalledWith(
        `:steam_locomotive: Starting "${jobName}" Job`,
        channelId
      );
    });
  });

  describe('alertJobSuccess', () => {
    it('should post a slack message with the channel ID and content', async () => {
      await alertJobSuccess(jobName, channelId);

      expect(postMessage).toHaveBeenCalledWith(
        `:checkered_flag: :white_check_mark: "${jobName}" Job ran successfully`,
        channelId
      );
    });
  });

  describe('alertJobFail', () => {
    it('should post a slack message with the channel ID and content', async () => {
      await alertJobFail(jobName, errorMessage, channelId);

      expect(postMessage).toHaveBeenCalledWith(
        `:x: "${jobName}" Job failed to run -- error message: ${errorMessage}`,
        channelId
      );
    });
  });
});
