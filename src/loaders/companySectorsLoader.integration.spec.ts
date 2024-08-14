import { Connection, In, Repository } from 'typeorm';
import { getOrCreateConnection } from '../dbConnection';
import { CompanyEntity } from '../entities/Company';
import { CompanySectorEntity } from '../entities/CompanySector';
import { SectorEntity } from '../entities/Sector';
import { UserEntity } from '../entities/User';
import { createCompanyMock } from '../mocks/company';
import { createCompanySectorMock } from '../mocks/companySector';
import { createSectorMock } from '../mocks/sector';
import { createUserMock } from '../mocks/user';
import { UserRepository } from '../repositories/UserRepository';
import { CompanySectorType, RoleName } from '../types';
import { batchCompanySectors } from './companySectorsLoader';

const primaryCompanySectorId = '';
const secondaryCompanySectorId = '';
const anotherCompanySectorId = '';

const companyId = '';
const anotherCompanyId = '';

const sectorId = '';
const anotherSectorId = '';
const sectorName = '';
const anotherSectorName = '';

const adminId = '';
const userId = '';

const setup = async (
  companySectorRepository: Repository<CompanySectorEntity>,
  companyRepository: Repository<CompanyEntity>,
  sectorRepository: Repository<SectorEntity>,
  userRepository: Repository<UserEntity>
) => {
  await userRepository.save([
    await createUserMock({ id: adminId }, RoleName.Admin),
  ]);

  await companyRepository.save([
    createCompanyMock({ id: companyId, updatedBy: adminId }),
    createCompanyMock({ id: anotherCompanyId, updatedBy: adminId }),
  ]);

  await userRepository.save([
    await createUserMock({ id: userId, companyId }, RoleName.SupplierEditor),
  ]);

  await sectorRepository.save([
    createSectorMock({ id: sectorId, name: sectorName }),
    createSectorMock({ id: anotherSectorId, name: anotherSectorName }),
  ]);

  await companySectorRepository.save([
    createCompanySectorMock({
      id: primaryCompanySectorId,
      companyId,
      sectorId,
      createdBy: userId,
      updatedBy: userId,
    }),
    createCompanySectorMock({
      id: anotherCompanySectorId,
      companyId: anotherCompanyId,
      sectorId,
      createdBy: userId,
      updatedBy: userId,
    }),
  ]);
};

const teardown = async (
  companySectorRepository: Repository<CompanySectorEntity>,
  companyRepository: Repository<CompanyEntity>,
  sectorRepository: Repository<SectorEntity>,
  userRepository: UserRepository
) => {
  await companySectorRepository.delete({
    id: In([
      primaryCompanySectorId,
      secondaryCompanySectorId,
      anotherCompanySectorId,
    ]),
  });
  await sectorRepository.delete({ id: In([sectorId, anotherSectorId]) });

  await userRepository.deleteUsers([userId]);

  await companyRepository.delete({
    id: In([companyId, anotherCompanyId]),
  });
  await userRepository.deleteUsers([adminId]);
};

describe('Company Sector Loaders', () => {
  let connection: Connection;
  let companySectorRepository: Repository<CompanySectorEntity>;
  let companyRepository: Repository<CompanyEntity>;
  let sectorRepository: Repository<SectorEntity>;
  let userRepository: UserRepository;

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companySectorRepository = await connection.getRepository(
      CompanySectorEntity
    );
    companyRepository = await connection.getRepository(CompanyEntity);
    sectorRepository = await connection.getRepository(SectorEntity);
    userRepository = await connection.getCustomRepository(UserRepository);
  });

  beforeEach(async () => {
    await teardown(
      companySectorRepository,
      companyRepository,
      sectorRepository,
      userRepository
    );
    await setup(
      companySectorRepository,
      companyRepository,
      sectorRepository,
      userRepository
    );
  });

  afterAll(async () => {
    await teardown(
      companySectorRepository,
      companyRepository,
      sectorRepository,
      userRepository
    );
  });

  describe(batchCompanySectors.name, () => {
    it('should return company sectors where they exist', async () => {
      const results = await batchCompanySectors([companyId]);

      expect(results.length).toEqual(1);
      expect(results).toEqual([
        [expect.objectContaining({ id: primaryCompanySectorId, companyId })],
      ]);
    });

    it('should group company sectors by company', async () => {
      await companySectorRepository.save([
        createCompanySectorMock({
          id: secondaryCompanySectorId,
          companyId,
          sectorId: anotherSectorId,
          createdBy: userId,
          updatedBy: userId,
          sectorType: CompanySectorType.Secondary,
        }),
      ]);

      const results = await batchCompanySectors([companyId, anotherCompanyId]);

      expect(results.length).toEqual(2);
      expect(results).toEqual([
        expect.arrayContaining([
          expect.objectContaining({ id: primaryCompanySectorId, companyId }),
          expect.objectContaining({ id: secondaryCompanySectorId, companyId }),
        ]),
        expect.arrayContaining([
          expect.objectContaining({
            id: anotherCompanySectorId,
            companyId: anotherCompanyId,
          }),
        ]),
      ]);
    });

    it('should return an undefined slot when a company does not exist', async () => {
      const notARealCompanyId = '';
      const results = await batchCompanySectors([companyId, notARealCompanyId]);

      expect(results.length).toEqual(2);
      expect(results).toEqual([
        expect.arrayContaining([
          expect.objectContaining({ id: primaryCompanySectorId, companyId }),
        ]),
        undefined,
      ]);
    });
  });
});
