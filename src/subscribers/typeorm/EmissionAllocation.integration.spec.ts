import { Connection, Repository } from 'typeorm';
import { getOrCreateConnection } from '../../dbConnection';
import { CompanyEntity } from '../../entities/Company';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { addJobEmissionAllocationCreatedToQueue } from '../../jobs/tasks/emissionAllocation/queue';
import { createCompanyMock } from '../../mocks/company';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { createEmissionAllocationMock } from '../../mocks/emissionAllocation';

jest.mock('../../jobs/tasks/emissionAllocation/queue');

const CUSTOMER_ID = 'F690E668-29ED-11ED-A261-0242AC120002';
const SUPPLIER_ID = '1E4459B0-29EE-11ED-A261-0242AC120002';
const SUPPLIER_CORPORATE_EMISSION_ID = '17852A10-29F2-11ED-A261-0242AC120002';

const setup = async (
  companyRepository: Repository<CompanyEntity>,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>
) => {
  await companyRepository.save([
    createCompanyMock({ id: CUSTOMER_ID }),
    createCompanyMock({ id: SUPPLIER_ID }),
  ]);
  await corporateEmissionRepository.save(
    createCorporateEmissionMock({
      id: SUPPLIER_CORPORATE_EMISSION_ID,
      companyId: SUPPLIER_ID,
    })
  );
};

const teardown = async (
  companyRepository: Repository<CompanyEntity>,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>
) => {
  await companyRepository.delete([CUSTOMER_ID, SUPPLIER_ID]);
  await corporateEmissionRepository.delete(SUPPLIER_CORPORATE_EMISSION_ID);
};

describe('EmissionAllocationSubscriber', () => {
  let connection: Connection;
  let companyRepository: Repository<CompanyEntity>;
  let corporateEmissionRepository: Repository<CorporateEmissionEntity>;
  let emissionAllocationRepository: Repository<EmissionAllocationEntity>;

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = connection.getRepository(CompanyEntity);
    corporateEmissionRepository = connection.getRepository(
      CorporateEmissionEntity
    );
    emissionAllocationRepository = connection.getRepository(
      EmissionAllocationEntity
    );
  });
  beforeEach(async () => {
    await teardown(companyRepository, corporateEmissionRepository);
    await setup(companyRepository, corporateEmissionRepository);
  });
  afterAll(async () => {
    await teardown(companyRepository, corporateEmissionRepository);
  });
  describe('after inserting an emission allocation', () => {
    it('adds an emission allocation created job to the queue', async () => {
      const emissionAllocation = await emissionAllocationRepository.save(
        createEmissionAllocationMock({
          customerId: CUSTOMER_ID,
          supplierId: SUPPLIER_ID,
          supplierEmissionId: SUPPLIER_CORPORATE_EMISSION_ID,
        })
      );
      expect(addJobEmissionAllocationCreatedToQueue).toHaveBeenCalledWith(
        emissionAllocation
      );
      await emissionAllocationRepository.delete(emissionAllocation);
    });
  });
});
