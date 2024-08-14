import { Connection, Repository } from 'typeorm';
import { getOrCreateConnection } from '../../dbConnection';
import { CompanyEntity } from '../../entities/Company';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import {
  addJobCorporateEmissionCreatedToQueue,
  addJobCorporateEmissionDeletedToQueue,
  addJobCorporateEmissionUpdatedToQueue,
} from '../../jobs/tasks/corporateEmission/queue';
import { createCompanyMock } from '../../mocks/company';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { createUserMock } from '../../mocks/user';
import { UserRepository } from '../../repositories/UserRepository';
import { RoleName } from '../../types';

jest.mock('../../jobs/tasks/corporateEmission/queue');

const companyId = '';
const userId = '';
const emissionId = '';

const setup = async (
  userRepository: UserRepository,
  companyRepository: Repository<CompanyEntity>,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>
) => {
  await userRepository.save(
    await createUserMock({ id: userId }, RoleName.SupplierEditor)
  );
  await companyRepository.save(
    createCompanyMock({ id: companyId, createdBy: userId, updatedBy: userId })
  );
  await corporateEmissionRepository.save(
    createCorporateEmissionMock({ id: emissionId, companyId })
  );
};

const teardown = async (
  userRepository: UserRepository,
  companyRepository: Repository<CompanyEntity>,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>
) => {
  await corporateEmissionRepository.delete(emissionId);
  await companyRepository.delete({
    id: companyId,
  });
  await userRepository.deleteUsers([userId]);
};

describe('CorporateEmissionSubscriber', () => {
  let connection: Connection;
  let userRepository: UserRepository;
  let companyRepository: Repository<CompanyEntity>;
  let corporateEmissionRepository: Repository<CorporateEmissionEntity>;
  beforeAll(async () => {
    connection = await getOrCreateConnection();
    userRepository = connection.getCustomRepository(UserRepository);
    companyRepository = connection.getRepository(CompanyEntity);
    corporateEmissionRepository = connection.getRepository(
      CorporateEmissionEntity
    );
  });
  beforeEach(async () => {
    await teardown(
      userRepository,
      companyRepository,
      corporateEmissionRepository
    );
    await setup(userRepository, companyRepository, corporateEmissionRepository);
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await teardown(
      userRepository,
      companyRepository,
      corporateEmissionRepository
    );
  });
  describe('after a corporate emission is inserted', () => {
    it('adds a corporate emission created job to the queue', async () => {
      const newCorporateEmission = corporateEmissionRepository.create(
        createCorporateEmissionMock({
          id: '14DA3EAE-FD33-11EC-B939-0242AC120002',
          companyId,
        })
      );
      await newCorporateEmission.save();

      expect(addJobCorporateEmissionCreatedToQueue).toHaveBeenCalledTimes(1);
      expect(addJobCorporateEmissionCreatedToQueue).toHaveBeenCalledWith(
        newCorporateEmission
      );

      await newCorporateEmission.remove();
    });
  });
  describe('after a corporate emission is updated', () => {
    it('adds a corporate emission updated job to the queue', async () => {
      const corporateEmission = await corporateEmissionRepository.findOneOrFail(
        emissionId
      );
      const prevCorporateEmission = { ...corporateEmission };
      corporateEmission.scope1 = 24;
      corporateEmission.scope2 = 25;
      await corporateEmission.save();

      expect(addJobCorporateEmissionUpdatedToQueue).toHaveBeenCalledTimes(1);
      expect(addJobCorporateEmissionUpdatedToQueue).toHaveBeenCalledWith({
        prev: prevCorporateEmission,
        updated: corporateEmission,
        updatedColumns: ['scope1', 'scope2'],
      });
    });
  });
  describe('after a corporate emission is deleted', () => {
    it('adds a corporate emission deleted job to the queue', async () => {
      const corporateEmission = await corporateEmissionRepository.findOneOrFail(
        emissionId
      );
      await corporateEmission.remove();

      expect(addJobCorporateEmissionDeletedToQueue).toHaveBeenCalledTimes(1);
      expect(addJobCorporateEmissionDeletedToQueue).toHaveBeenCalledWith(
        corporateEmission
      );
    });
  });
});
