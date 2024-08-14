import { Connection, Repository } from 'typeorm';
import { getOrCreateConnection } from '../../dbConnection';
import { CompanyEntity } from '../../entities/Company';
import { addJobCompanyRelationshipCreatedToQueue } from '../../jobs/tasks/companyRelationship/queue';
import { createCompanyMock } from '../../mocks/company';
import { createCompanyRelationshipMock } from '../../mocks/companyRelationship';
import { CompanyRelationshipRepository } from '../../repositories/CompanyRelationshipRepository';

jest.mock('../../jobs/tasks/companyRelationship/queue');

const CUSTOMER_ID = '04D38588-2A01-11ED-A261-0242AC120002';
const SUPPLIER_ID = '157384D8-2A01-11ED-A261-0242AC120002';

const setup = async (companyRepository: Repository<CompanyEntity>) => {
  await companyRepository.save([
    createCompanyMock({ id: CUSTOMER_ID }),
    createCompanyMock({ id: SUPPLIER_ID }),
  ]);
};

const teardown = async (
  companyRepository: Repository<CompanyEntity>,
  companyRelationshipRepository: CompanyRelationshipRepository
) => {
  await companyRelationshipRepository.delete({});
  await companyRepository.delete([CUSTOMER_ID, SUPPLIER_ID]);
};

describe('CompanyRelationshipSubscriber', () => {
  let connection: Connection;
  let companyRelationshipRepository: CompanyRelationshipRepository;
  let companyRepository: Repository<CompanyEntity>;

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = connection.getRepository(CompanyEntity);
    companyRelationshipRepository = connection.getCustomRepository(
      CompanyRelationshipRepository
    );
  });
  beforeEach(async () => {
    await teardown(companyRepository, companyRelationshipRepository);
    await setup(companyRepository);
  });
  afterAll(async () => {
    await teardown(companyRepository, companyRelationshipRepository);
  });
  describe('after inserting a company relationship record', () => {
    it('adds a company relationship created job to the queue', async () => {
      const companyRelationship = await companyRelationshipRepository.save(
        createCompanyRelationshipMock({
          customerId: CUSTOMER_ID,
          supplierId: SUPPLIER_ID,
        })
      );
      expect(addJobCompanyRelationshipCreatedToQueue).toHaveBeenCalledWith(
        companyRelationship
      );
      await companyRelationshipRepository.delete(companyRelationship);
    });
  });
});
