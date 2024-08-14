import {
  DEFAULT_ATTEMPTS,
  DEFAULT_TIMEOUT,
  TARGET_CREATED,
  TARGET_DELETED,
  TARGET_UPDATED,
} from '../../../constants/queue';
import { TargetEntity } from '../../../entities/Target';
import { targetQueue } from '../../queues';
import {
  addJobTargetCreatedToQueue,
  addJobTargetDeletedToQueue,
  addJobTargetUpdatedToQueue,
} from './queue';

jest.mock('../../queues');

describe('Target queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addJobTargetCreatedToQueue', () => {
    it('adds target created event to job queue', async () => {
      const target = { id: 'some-target-id' } as TargetEntity;
      await addJobTargetCreatedToQueue(target);

      expect(targetQueue.add).toHaveBeenCalledTimes(1);
      expect(targetQueue.add).toHaveBeenCalledWith(TARGET_CREATED, target, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('addJobTargetUpdatedToQueue', () => {
    it('calls to add target updated event to job queue', async () => {
      const data = {
        prev: { reduction: 20 } as TargetEntity,
        updated: { id: 'some-target-id' } as TargetEntity,
        updatedColumns: ['reduction'] as Array<keyof TargetEntity>,
      };
      await addJobTargetUpdatedToQueue(data);

      expect(targetQueue.add).toHaveBeenCalledTimes(1);
      expect(targetQueue.add).toHaveBeenCalledWith(TARGET_UPDATED, data, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('addJobTargetDeletedToQueue', () => {
    it('adds target deleted event to job queue', async () => {
      const target = { id: 'some-target-id' } as TargetEntity;
      await addJobTargetDeletedToQueue(target);

      expect(targetQueue.add).toHaveBeenCalledTimes(1);
      expect(targetQueue.add).toHaveBeenCalledWith(TARGET_DELETED, target, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });
});
