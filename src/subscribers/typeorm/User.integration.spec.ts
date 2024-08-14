import { Connection } from 'typeorm';
import { hubspotCrmClient } from '../../clients/HubspotCrmClient';
import { getOrCreateConnection } from '../../dbConnection';
import {
  addJobUserDeletedToQueue,
  addJobUserUpdatedToQueue,
} from '../../jobs/tasks/user/queue';
import { createUserMock } from '../../mocks/user';
import { UserRepository } from '../../repositories/UserRepository';
import { RoleName } from '../../types';

jest.mock('../../clients/HubspotCrmClient');

jest.mock('../../jobs/tasks/user/queue');
jest.mock('../../config', () => {
  const actual = jest.requireActual('../../config');
  return {
    ...actual,
    getConfig: jest.fn().mockReturnValue({ ...actual.getConfig(), flags: {} }),
  };
});

const userId = '';

const setup = async (userRepository: UserRepository) => {
  await userRepository.save([
    await createUserMock({ id: userId }, RoleName.SupplierViewer),
  ]);
};

const teardown = async (userRepository: UserRepository) => {
  await userRepository.deleteUsers([userId]);
};

describe('UserEntitySubscriber', () => {
  let connection: Connection;
  let userRepository: UserRepository;
  beforeAll(async () => {
    connection = await getOrCreateConnection();
    userRepository = connection.getCustomRepository(UserRepository);
  });
  beforeEach(async () => {
    await teardown(userRepository);
    await setup(userRepository);
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await teardown(userRepository);
    await userRepository.deleteUsers([userId]);
  });
  describe('after user is inserted', () => {
    it('adds user created job to queue', async () => {
      (hubspotCrmClient.createContact as jest.Mock).mockResolvedValueOnce({});
      const newUserId = '';
      const newUser = await createUserMock(
        { id: newUserId },
        RoleName.SupplierEditor
      );

      const inviter = await createUserMock(
        { id: 'inviter-id' },
        RoleName.SupplierEditor
      );

      const user = userRepository.create(newUser);
      await user.save({ data: { inviter } });

      expect(user.id).toBe(newUserId);

      expect(hubspotCrmClient.createContact).toBeCalledTimes(1);
      expect(hubspotCrmClient.createContact).toBeCalledWith(
        user,
        inviter,
        expect.any(Object)
      );

      await userRepository.deleteUsers([user.id]);
    });
  });
  describe('after user is updated', () => {
    it('adds user updated job to queue', async () => {
      (addJobUserUpdatedToQueue as jest.Mock).mockResolvedValueOnce({});
      const newUserFirstName = 'new-user-first-name';
      const user = await userRepository.findOneOrFail(userId);

      const prevUser = { ...user };

      user.firstName = newUserFirstName;
      const updatedUser = await user.save();

      expect(addJobUserUpdatedToQueue).toBeCalledTimes(1);
      expect(addJobUserUpdatedToQueue).toBeCalledWith({
        prev: prevUser,
        updated: updatedUser,
        updatedColumns: ['firstName'],
      });
      expect(addJobUserDeletedToQueue).not.toHaveBeenCalled();
    });
    it('adds user deleted job to queue on soft deletion', async () => {
      (addJobUserDeletedToQueue as jest.Mock).mockResolvedValueOnce({});
      const user = await userRepository.findOneOrFail(userId);

      const [deletedUser] = await userRepository.softDeleteUsers([user]);

      expect(addJobUserDeletedToQueue).toBeCalledTimes(1);
      expect(addJobUserDeletedToQueue).toBeCalledWith(deletedUser);
      expect(addJobUserUpdatedToQueue).not.toHaveBeenCalled();
    });
  });
});
