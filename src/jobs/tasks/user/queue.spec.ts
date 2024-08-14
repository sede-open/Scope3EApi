import {
  DEFAULT_ATTEMPTS,
  DEFAULT_TIMEOUT,
  HUBSPOT_CONTACT_CREATED,
  USER_CREATED,
  USER_DELETED,
  USER_UPDATED,
} from '../../../constants/queue';
import { UserEntity } from '../../../entities/User';
import { UserStatus } from '../../../types';
import { userQueue } from '../../queues';
import {
  addJobUserCreatedToQueue,
  addJobUserUpdatedToQueue,
  addJobUserDeletedToQueue,
  addJobHubspotContactCreatedToQueue,
} from './queue';

jest.mock('../../queues', () => ({
  userQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

describe('User Queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addJobUserCreatedToQueue', () => {
    it('should add user created event to job queue', async () => {
      const user = { id: 'some-user-id' } as UserEntity;
      const inviter = { id: 'some-inviter-id' } as UserEntity;
      const data = { user, inviter };
      await addJobUserCreatedToQueue(data);

      expect(userQueue.add).toHaveBeenCalledTimes(1);
      expect(userQueue.add).toHaveBeenCalledWith(USER_CREATED, data, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('addJobUserUpdatedToQueue', () => {
    it('does not call to add user updated event to job queue, when updatedColumns arg is empty', async () => {
      const data = {
        prev: { status: UserStatus.Active } as UserEntity,
        updated: { id: 'some-user-id' } as UserEntity,
        updatedColumns: [],
      };
      await addJobUserUpdatedToQueue(data);

      expect(userQueue.add).not.toHaveBeenCalled();
    });
    it('calls to add user updated event to job queue', async () => {
      const data = {
        prev: { status: UserStatus.Active } as UserEntity,
        updated: { id: 'some-user-id' } as UserEntity,
        updatedColumns: ['status'] as Array<keyof UserEntity>,
      };
      await addJobUserUpdatedToQueue(data);

      expect(userQueue.add).toHaveBeenCalledTimes(1);
      expect(userQueue.add).toHaveBeenCalledWith(USER_UPDATED, data, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('addJobUserDeletedToQueue', () => {
    it('should add user created event to job queue', async () => {
      const user = { id: 'some-user-id' } as UserEntity;
      await addJobUserDeletedToQueue(user);

      expect(userQueue.add).toHaveBeenCalledTimes(1);
      expect(userQueue.add).toHaveBeenCalledWith(USER_DELETED, user, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });
  describe('addJobHubspotContactCreatedToQueue', () => {
    it('should add Hubspot contact created event to job queue', async () => {
      const data = {
        contact: { id: 'some-contact-id', properties: {} },
        companyId: 'some-company-id',
      };
      await addJobHubspotContactCreatedToQueue(data);

      expect(userQueue.add).toHaveBeenCalledTimes(1);
      expect(userQueue.add).toHaveBeenCalledWith(
        HUBSPOT_CONTACT_CREATED,
        data,
        {
          jobId: expect.any(String),
          attempts: DEFAULT_ATTEMPTS,
          timeout: DEFAULT_TIMEOUT,
        }
      );
    });
  });
});
