import { Connection } from 'typeorm';
import { getOrCreateConnection } from '../dbConnection';
import { createUserMock } from '../mocks/user';
import { UserRepository } from '../repositories/UserRepository';
import { RoleName } from '../types';
import { batchUserRoles } from './userRoleLoader';

const adminId = '';

const setup = async (userRepository: UserRepository) => {
  await userRepository.save([
    await createUserMock({ id: adminId }, RoleName.Admin),
  ]);
};

const teardown = async (userRepository: UserRepository) => {
  await userRepository.deleteUsers([adminId]);
};

describe('User Role Loaders', () => {
  let connection: Connection;
  let userRepository: UserRepository;

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    userRepository = await connection.getCustomRepository(UserRepository);
  });

  beforeEach(async () => {
    await teardown(userRepository);
    await setup(userRepository);
  });

  afterAll(async () => {
    await teardown(userRepository);
  });

  describe('batchUserRoles', () => {
    it('should return company sectors where they exist', async () => {
      const [results] = await batchUserRoles([adminId]);

      expect(results).toHaveLength(3);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: RoleName.Admin }),
          expect.objectContaining({ name: RoleName.SupplierEditor }),
          expect.objectContaining({ name: RoleName.SupplierViewer }),
        ])
      );
    });
  });
});
