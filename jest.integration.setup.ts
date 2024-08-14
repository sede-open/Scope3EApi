import {
  getConnection,
  Connection,
  createConnection,
  getConnectionOptions,
  In,
} from 'typeorm';
import ioredisMock from 'ioredis-mock';

import { getConfig } from './src/config';
import { RoleName } from './src/types';
import { CompanyEntity } from './src/entities/Company';
import { RoleRepository } from './src/repositories/RoleRepository';
import { UserRepository } from './src/repositories/UserRepository';
import { UserEntity } from './src/entities/User';
import { company2Mock, companyMock, company3Mock } from './src/mocks/company';
import { adminUserMock, supplierEditorUserMock } from './src/mocks/user';
import { FileEntity } from './src/entities/File';
import { fileMock } from './src/mocks/file';
import { LaunchDarklyClient } from './src/clients/LaunchDarklyClient';

jest.setTimeout(30000);

jest.setMock('ioredis', ioredisMock);
jest.mock('./src/clients/AzureBlobClient');

process.env.JWT_ISSUER = 'localhost:4000';
process.env.INVITE_JWT_SECRET = 'iamsecret';
process.env.WEB_APP_BASE_URL = 'localhost:3000';
process.env.AUTH_AUTH_SECRET = 'Aswertyuioasdfghjkqwertyuiqwerty';

// setup a new test connection each time
export async function createNewTestConnection() {
  const { integrationTestDropSchema } = getConfig();
  const options = await getConnectionOptions();
  return createConnection({
    ...options,
    dropSchema: integrationTestDropSchema,
  });
}

export const teardownPreviousDbState = async (connection: Connection) => {
  const userRepository = await connection.getCustomRepository(UserRepository);
  await connection.getRepository(FileEntity).delete({ id: In([fileMock.id]) });

  await userRepository.deleteUsers([
    supplierEditorUserMock.id,
    adminUserMock.id,
  ]);
  await userRepository.deleteUsersByCompanyId([
    companyMock.id,
    company2Mock.id,
    company3Mock.id,
  ]);

  await connection
    .getRepository(CompanyEntity)
    .delete({ id: In([companyMock.id, company2Mock.id, company3Mock.id]) });
};

// setup most essential data only
const setupDBForTesting = async (connection: Connection) => {
  await connection.getRepository(CompanyEntity).save(companyMock);
  await connection.getRepository(CompanyEntity).save(company2Mock);
  await connection.getRepository(CompanyEntity).save(company3Mock);

  const rolesRepo = await connection.getCustomRepository(RoleRepository);

  const roles = await rolesRepo.find();

  const adminRole = roles.find((e) => e.name === RoleName.Admin);
  if (adminRole) {
    const user = new UserEntity({ ...adminUserMock });
    user.roles = await rolesRepo.findNewRoleSet(RoleName.Admin, user);
    await user.save();
  }

  await connection.getRepository(UserEntity).save({
    ...supplierEditorUserMock,
  });

  await connection.getRepository(FileEntity).save(fileMock);
};

beforeAll(async () => {
  const connection = await createNewTestConnection();

  await teardownPreviousDbState(connection);

  await setupDBForTesting(connection);
});

afterAll(async () => {
  const connection = await getConnection();
  await teardownPreviousDbState(connection);
  await connection.close();

  if (LaunchDarklyClient.hasInstance()) {
    const client = (await LaunchDarklyClient.getInstance()).getClient();
    client.close();
  }
});
