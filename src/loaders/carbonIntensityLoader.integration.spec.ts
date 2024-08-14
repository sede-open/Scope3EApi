import { Repository, In, Connection } from 'typeorm';
import { getOrCreateConnection } from '../dbConnection';
import { CompanyEntity } from '../entities/Company';
import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import { UserEntity } from '../entities/User';
import { createCompanyMock } from '../mocks/company';
import { createUserMock } from '../mocks/user';
import { createCorporateEmissionMock } from '../mocks/emission';
import {
  CarbonIntensityMetricType,
  CarbonIntensityType,
  RoleName,
} from '../types';
import { batchCarbonIntensities } from './carbonIntensityLoader';
import { CarbonIntensityEntity } from '../entities/CarbonIntensity';
import { createCarbonIntensityMock } from '../mocks/carbonIntensities';
import { UserRepository } from '../repositories/UserRepository';

const userId = '';
const companyId = '';
const emissionWithCarbonIntensitiesId = '';
const emissionWithoutCarbonIntensitiesId = '';
const firstCarbonIntensityId = '';
const secondCarbonIntensityId = '';
const estimatedCarbonIntensityId = '';

const setup = async (
  companyRepository: Repository<CompanyEntity>,
  userRepository: Repository<UserEntity>,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>
) => {
  await userRepository.save([
    await createUserMock({ id: userId }, RoleName.Admin),
  ]);

  await companyRepository.save([
    createCompanyMock({ id: companyId, updatedBy: userId }),
  ]);

  await corporateEmissionRepository.save([
    createCorporateEmissionMock({
      id: emissionWithCarbonIntensitiesId,
      companyId,
      createdBy: userId,
      updatedBy: userId,
    }),
    createCorporateEmissionMock({
      id: emissionWithoutCarbonIntensitiesId,
      companyId,
      createdBy: userId,
      updatedBy: userId,
    }),
  ]);
};

const teardown = async (
  companyRepository: Repository<CompanyEntity>,
  userRepository: UserRepository,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>
) => {
  /* no need to delete carbon intensities here as using an ON DELETE CASCADE FK */
  await corporateEmissionRepository.delete({
    id: In([
      emissionWithCarbonIntensitiesId,
      emissionWithoutCarbonIntensitiesId,
    ]),
  });
  await companyRepository.delete({
    id: In([companyId]),
  });
  await userRepository.deleteUsers([userId]);
};

describe('Carbon Intensities Loaders', () => {
  let connection: Connection;
  let companyRepository: Repository<CompanyEntity>;
  let userRepository: UserRepository;
  let corporateEmissionRepository: Repository<CorporateEmissionEntity>;
  let carbonIntensityRepository: Repository<CarbonIntensityEntity>;

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = await connection.getRepository(CompanyEntity);
    userRepository = await connection.getCustomRepository(UserRepository);
    corporateEmissionRepository = await connection.getRepository(
      CorporateEmissionEntity
    );
    carbonIntensityRepository = await connection.getRepository(
      CarbonIntensityEntity
    );
  });

  beforeEach(async () => {
    await teardown(
      companyRepository,
      userRepository,
      corporateEmissionRepository
    );
    await setup(companyRepository, userRepository, corporateEmissionRepository);
  });

  afterAll(async () => {
    await teardown(
      companyRepository,
      userRepository,
      corporateEmissionRepository
    );
  });

  describe('batchCarbonIntensities', () => {
    describe('when the emission has associated carbon intensities', () => {
      it(`should return ${CarbonIntensityType.UserSubmitted} type of carbon intensities associated with the provided emissionId`, async () => {
        await carbonIntensityRepository.save([
          createCarbonIntensityMock({
            companyId,
            emissionId: emissionWithCarbonIntensitiesId,
            id: firstCarbonIntensityId,
            createdBy: userId,
            updatedBy: userId,
            intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
            intensityValue: 200,
          }),
          createCarbonIntensityMock({
            companyId,
            emissionId: emissionWithCarbonIntensitiesId,
            id: secondCarbonIntensityId,
            createdBy: userId,
            updatedBy: userId,
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityValue: 200000,
          }),
          createCarbonIntensityMock({
            companyId,
            emissionId: emissionWithCarbonIntensitiesId,
            id: estimatedCarbonIntensityId,
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityValue: 200000,
            type: CarbonIntensityType.Estimated,
          }),
        ]);

        const results = await batchCarbonIntensities([
          emissionWithCarbonIntensitiesId,
        ]);

        expect(results).toEqual([
          [
            expect.objectContaining({
              companyId,
              id: firstCarbonIntensityId,
              emissionId: emissionWithCarbonIntensitiesId,
              intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
              intensityValue: 200,
            }),
            expect.objectContaining({
              companyId,
              id: secondCarbonIntensityId,
              emissionId: emissionWithCarbonIntensitiesId,
              intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
              intensityValue: 200000,
            }),
          ],
        ]);
      });
    });

    describe('when the emission does not have associated carbon intensities', () => {
      it('should return an empty array', async () => {
        const results = await batchCarbonIntensities([
          emissionWithoutCarbonIntensitiesId,
        ]);

        expect(results).toEqual([[]]);
      });
    });
  });
});
