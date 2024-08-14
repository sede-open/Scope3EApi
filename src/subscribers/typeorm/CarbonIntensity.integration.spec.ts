import { Connection, In, Repository } from 'typeorm';
import { getOrCreateConnection } from '../../dbConnection';

import { CarbonIntensityEntity } from '../../entities/CarbonIntensity';
import { CompanyEntity } from '../../entities/Company';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { UserEntity } from '../../entities/User';

import { TargetRepository } from '../../repositories/TargetRepository';

import { createCompanyMock } from '../../mocks/company';
import { createUserMock } from '../../mocks/user';
import {
  CarbonIntensityMetricType,
  RoleName,
  TargetScopeType,
  TargetType,
} from '../../types';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { createCarbonIntensityMock } from '../../mocks/carbonIntensities';
import { createTargetMock } from '../../mocks/target';
import { UserRepository } from '../../repositories/UserRepository';

const companyId = '';
const userId = '';
const corporateEmissionId = '';
const carbonIntensityId = '';
const secondaryCarbonIntensityId = '';
const targetId = '';
const secondaryTargetId = '';

const setup = async (
  companyRepository: Repository<CompanyEntity>,
  userRepository: Repository<UserEntity>,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>
) => {
  await userRepository.save([
    await createUserMock({ id: userId }, RoleName.Admin),
  ]);

  await companyRepository.save([
    createCompanyMock({ id: companyId, createdBy: userId, updatedBy: userId }),
  ]);

  await corporateEmissionRepository.save([
    createCorporateEmissionMock({
      id: corporateEmissionId,
      companyId,
      createdBy: userId,
      updatedBy: userId,
    }),
  ]);
};

const teardown = async (
  connection: Connection,
  companyRepository: Repository<CompanyEntity>,
  userRepository: UserRepository,
  corporateEmissionRepository: Repository<CorporateEmissionEntity>,
  carbonIntensityRepository: Repository<CarbonIntensityEntity>,
  targetRepository: TargetRepository
) => {
  await connection.query('DELETE FROM CARBON_INTENSITY_TARGET');
  await targetRepository.delete({ id: In([targetId, secondaryTargetId]) });
  await carbonIntensityRepository.delete({
    id: In([carbonIntensityId, secondaryCarbonIntensityId]),
  });
  await corporateEmissionRepository.delete({ id: In([corporateEmissionId]) });
  await companyRepository.delete({
    id: In([companyId]),
  });
  await userRepository.deleteUsers([userId]);
};

describe('CarbonIntensityEntitySubscriber', () => {
  let connection: Connection;
  let companyRepository: Repository<CompanyEntity>;
  let userRepository: UserRepository;
  let corporateEmissionRepository: Repository<CorporateEmissionEntity>;
  let carbonIntensityRepository: Repository<CarbonIntensityEntity>;
  let targetRepository: TargetRepository;

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
    targetRepository = connection.getCustomRepository(TargetRepository);
  });

  beforeEach(async () => {
    await teardown(
      connection,
      companyRepository,
      userRepository,
      corporateEmissionRepository,
      carbonIntensityRepository,
      targetRepository
    );
    await setup(companyRepository, userRepository, corporateEmissionRepository);
  });

  afterAll(async () => {
    await teardown(
      connection,
      companyRepository,
      userRepository,
      corporateEmissionRepository,
      carbonIntensityRepository,
      targetRepository
    );
  });

  describe('when the carbon intensity does not have any associated targets', () => {
    it('should delete the carbon intensity', async () => {
      await carbonIntensityRepository.save([
        createCarbonIntensityMock({
          id: carbonIntensityId,
          companyId,
          emissionId: corporateEmissionId,
          createdBy: userId,
          updatedBy: userId,
        }),
      ]);
      expect(await carbonIntensityRepository.find()).toHaveLength(1);
      await carbonIntensityRepository.delete([carbonIntensityId]);
      expect(await carbonIntensityRepository.find()).toHaveLength(0);
    });
  });

  describe('when a carbon intensity has an associated target', () => {
    describe('when the associated target is only related to the carbon intensity being deleted', () => {
      it('should delete the carbon intensity, and the associated target', async () => {
        await targetRepository.save([
          createTargetMock({
            id: targetId,
            companyId,
            createdBy: userId,
            updatedBy: userId,
            targetType: TargetType.Intensity,
          }),
        ]);

        const target = await targetRepository.findOneOrFail({
          where: {
            id: targetId,
          },
        });

        /* Save the Carb Intensity, creating the M2M record in the process */
        await carbonIntensityRepository.save([
          createCarbonIntensityMock({
            id: carbonIntensityId,
            companyId,
            emissionId: corporateEmissionId,
            createdBy: userId,
            updatedBy: userId,
            targets: [target],
          }),
        ]);

        const carbonIntensity = await carbonIntensityRepository.findOneOrFail({
          where: {
            id: carbonIntensityId,
          },
          relations: ['targets'],
        });

        /* Assert CI + Targets both created */
        expect(carbonIntensity?.targets).toHaveLength(1);

        /* Act, this should cascade all the necessary deletes */
        await carbonIntensityRepository.remove([carbonIntensity]);

        expect(await carbonIntensityRepository.find()).toHaveLength(0);
        expect(await targetRepository.find()).toHaveLength(0);
        expect(
          await connection.query(
            'SELECT COUNT(*) as count FROM CARBON_INTENSITY_TARGET'
          )
        ).toEqual([{ count: 0 }]);
      });

      it('should not interfere with targets unrelated to the carbon intensity', async () => {
        await targetRepository.save([
          createTargetMock({
            id: targetId,
            companyId,
            createdBy: userId,
            updatedBy: userId,
            targetType: TargetType.Intensity,
          }),
          /* Create a second target to ensure we're not tampering with unrelated data */
          createTargetMock({
            id: secondaryTargetId,
            companyId,
            createdBy: userId,
            updatedBy: userId,
            reduction: 50,
            year: 2028,
            targetType: TargetType.Intensity,
          }),
        ]);

        const target = await targetRepository.findOneOrFail({
          where: {
            id: targetId,
          },
        });

        /* Save the Carb Intensity, creating the M2M record in the process */
        await carbonIntensityRepository.save([
          createCarbonIntensityMock({
            id: carbonIntensityId,
            companyId,
            emissionId: corporateEmissionId,
            createdBy: userId,
            updatedBy: userId,
            targets: [target],
          }),
        ]);

        const carbonIntensity = await carbonIntensityRepository.findOneOrFail({
          where: {
            id: carbonIntensityId,
          },
          relations: ['targets'],
        });

        /* Assert CI + Targets both created */
        expect(carbonIntensity?.targets).toHaveLength(1);

        /* Act, this should cascade all the necessary deletes */
        await carbonIntensityRepository.remove([carbonIntensity]);

        const targets = await targetRepository.find();
        expect(targets).toHaveLength(1);
        expect(targets).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: secondaryTargetId }),
          ])
        );
      });

      describe('when there is a scope3 target also', () => {
        it('should delete the scope_1_2 and the scope_3 record', async () => {
          await targetRepository.save([
            createTargetMock({
              id: targetId,
              companyId,
              createdBy: userId,
              updatedBy: userId,
              targetType: TargetType.Intensity,
              scopeType: TargetScopeType.Scope_1_2,
            }),
            createTargetMock({
              id: secondaryTargetId,
              companyId,
              createdBy: userId,
              updatedBy: userId,
              targetType: TargetType.Intensity,
              scopeType: TargetScopeType.Scope_3,
            }),
          ]);

          const target = await targetRepository.findOneOrFail({
            where: {
              id: targetId,
            },
          });

          /* Save the Carb Intensity, creating the M2M record in the process */
          await carbonIntensityRepository.save([
            createCarbonIntensityMock({
              id: carbonIntensityId,
              companyId,
              emissionId: corporateEmissionId,
              createdBy: userId,
              updatedBy: userId,
              targets: [target],
            }),
          ]);

          const carbonIntensity = await carbonIntensityRepository.findOneOrFail(
            {
              where: {
                id: carbonIntensityId,
              },
              relations: ['targets'],
            }
          );

          /* Assert one associated target, and 2 total */
          expect(carbonIntensity?.targets).toHaveLength(1);
          expect(await targetRepository.find()).toHaveLength(2);

          /* Act, this should cascade all the necessary deletes */
          await carbonIntensityRepository.remove([carbonIntensity]);

          expect(await carbonIntensityRepository.find()).toHaveLength(0);
          expect(await targetRepository.find()).toHaveLength(0);
          expect(
            await connection.query(
              'SELECT COUNT(*) as count FROM CARBON_INTENSITY_TARGET'
            )
          ).toEqual([{ count: 0 }]);
        });
      });
    });

    describe('when the associated target is linked to multiple carbon intensities', () => {
      it('should delete the carbon intensity, but not the target', async () => {
        await targetRepository.save([
          createTargetMock({
            id: targetId,
            companyId,
            createdBy: userId,
            updatedBy: userId,
            targetType: TargetType.Intensity,
          }),
        ]);

        const target = await targetRepository.findOneOrFail({
          where: {
            id: targetId,
          },
        });

        /* Save two carbon intensities, creating two M2M records to the same target */
        await carbonIntensityRepository.save([
          createCarbonIntensityMock({
            id: carbonIntensityId,
            companyId,
            emissionId: corporateEmissionId,
            createdBy: userId,
            updatedBy: userId,
            targets: [target],
          }),
          createCarbonIntensityMock({
            id: secondaryCarbonIntensityId,
            companyId,
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityValue: 400000,
            emissionId: corporateEmissionId,
            createdBy: userId,
            updatedBy: userId,
            targets: [target],
          }),
        ]);

        const carbonIntensities = await carbonIntensityRepository.find({
          where: {
            id: In([carbonIntensityId, secondaryCarbonIntensityId]),
          },
          relations: ['targets'],
        });

        /* Assert CI + Targets both created */
        expect(carbonIntensities).toHaveLength(2);

        const carbonIntensity = carbonIntensities.find(
          (carbIntensity) => carbIntensity.id === carbonIntensityId
        );

        if (!carbonIntensity) {
          throw new Error(
            'Failed to find the Carbon Intensity we just created'
          );
        }

        /* Act, this should cascade all the necessary deletes */
        await carbonIntensityRepository.remove([carbonIntensity]);

        /* One of the two carbon intensities created is deleted */
        expect(await carbonIntensityRepository.find()).toHaveLength(1);

        /* The target was not deleted */
        expect(await targetRepository.find()).toHaveLength(1);

        /* The join between the deleted Carbon Intensity, and the Target was deleted */
        expect(
          await connection.query(
            'SELECT COUNT(*) as count FROM CARBON_INTENSITY_TARGET'
          )
        ).toEqual([{ count: 1 }]);
      });
    });
  });
});
