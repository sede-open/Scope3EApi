import { Connection, In, Repository } from 'typeorm';
import { CompanyEntity } from '../../entities/Company';
import { UserEntity } from '../../entities/User';
import { createCompanyMock } from '../../mocks/company';
import { createUserMock } from '../../mocks/user';
import { CompanyStatus, RoleName } from '../../types';
import { UserRepository } from '../../repositories/UserRepository';
import { getOrCreateConnection } from '../../dbConnection';
import { addJobCompanyUpdatedToQueue } from '../../jobs/tasks/company/queue';
import { hubspotCrmClient } from '../../clients/HubspotCrmClient';

jest.mock('../../jobs/tasks/company/queue');
jest.mock('../../clients/HubspotCrmClient');

const companyId = '';
const userId = '';

const setup = async (
  companyRepository: Repository<CompanyEntity>,
  userRepository: Repository<UserEntity>
) => {
  await userRepository.save([
    await createUserMock({ id: userId }, RoleName.Admin),
  ]);

  await companyRepository.save([
    createCompanyMock({ id: companyId, createdBy: userId, updatedBy: userId }),
  ]);
};

const teardown = async (
  companyRepository: Repository<CompanyEntity>,
  userRepository: UserRepository
) => {
  await companyRepository.delete({
    id: In([companyId]),
  });
  await userRepository.deleteUsers([userId]);
};

describe('CompanyEntitySubscriber', () => {
  let connection: Connection;
  let companyRepository: Repository<CompanyEntity>;
  let userRepository: UserRepository;
  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = connection.getRepository(CompanyEntity);
    userRepository = connection.getCustomRepository(UserRepository);
  });
  beforeEach(async () => {
    await teardown(companyRepository, userRepository);
    await setup(companyRepository, userRepository);
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await teardown(companyRepository, userRepository);
  });
  describe('after company is inserted', () => {
    it('adds company created job to the queue', async () => {
      (hubspotCrmClient.createCompany as jest.Mock).mockResolvedValueOnce({});
      const newCompanyId = '';
      const newCompany = createCompanyMock({ id: newCompanyId });

      const company = companyRepository.create(newCompany);
      await company.save();

      expect(company.id).toBe(newCompanyId);

      expect(hubspotCrmClient.createCompany).toBeCalledTimes(1);
      expect(hubspotCrmClient.createCompany).toBeCalledWith(
        company,
        expect.any(Object)
      );

      await company.remove();
    });
  });
  describe('after company is updated', () => {
    it('adds company updated job to the queue', async () => {
      (addJobCompanyUpdatedToQueue as jest.Mock).mockResolvedValueOnce({});
      const company = await companyRepository.findOneOrFail(companyId);

      const prevCompany = { ...company };

      company.status = CompanyStatus.PendingUserActivation;
      const updatedCompany = await company.save();

      expect(addJobCompanyUpdatedToQueue).toBeCalledTimes(1);
      expect(addJobCompanyUpdatedToQueue).toBeCalledWith({
        prev: prevCompany,
        updated: updatedCompany,
        updatedColumns: ['status'],
      });
    });
  });
});
