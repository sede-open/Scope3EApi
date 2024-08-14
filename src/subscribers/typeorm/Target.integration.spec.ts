import { Connection, In, Repository } from 'typeorm';
import { getOrCreateConnection } from '../../dbConnection';
import { CarbonIntensityEntity } from '../../entities/CarbonIntensity';
import { CompanyEntity } from '../../entities/Company';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { UserEntity } from '../../entities/User';
import {
  addJobTargetCreatedToQueue,
  addJobTargetDeletedToQueue,
  addJobTargetUpdatedToQueue,
} from '../../jobs/tasks/target/queue';
import { createCarbonIntensityMock } from '../../mocks/carbonIntensities';
import { createCompanyMock } from '../../mocks/company';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { createTargetMock } from '../../mocks/target';
import { createUserMock } from '../../mocks/user';
import { TargetRepository } from '../../repositories/TargetRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { RoleName, TargetPrivacyType, TargetType } from '../../types';

jest.mock('../../jobs/tasks/target/queue');

const companyId = '';
const userId = '';
const corporateEmissionId = '';
const carbonIntensityId = '';
const targetId = '';

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
  await targetRepository.delete({ id: In([targetId]) });
  await carbonIntensityRepository.delete({
    id: In([carbonIntensityId]),
  });
  await corporateEmissionRepository.delete({ id: In([corporateEmissionId]) });
  await companyRepository.delete({
    id: In([companyId]),
  });
  await userRepository.deleteUsers([userId]);
};

describe('TargetEntitySubscriber', () => {
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
    jest.clearAllMocks();
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

  describe('after inserting a target', () => {
    it('adds a target created job to queue', async () => {
      const target = await targetRepository.save(
        createTargetMock({
          id: targetId,
          companyId,
          createdBy: userId,
          updatedBy: userId,
          targetType: TargetType.Intensity,
        })
      );

      expect(addJobTargetCreatedToQueue).toBeCalledTimes(1);
      expect(addJobTargetCreatedToQueue).toHaveBeenCalledWith(target);
    });
  });

  describe('after updating a target', () => {
    it('adds a target updated job to queue', async () => {
      const prev = await targetRepository.save(
        createTargetMock({
          id: targetId,
          companyId,
          createdBy: userId,
          updatedBy: userId,
          targetType: TargetType.Intensity,
          carbonIntensities: undefined,
          privacyType: TargetPrivacyType.Private,
        })
      );

      const updated = await targetRepository.findOneOrFail(prev.id);
      updated.reduction = 32;

      await updated.save();

      expect(addJobTargetUpdatedToQueue).toBeCalledTimes(1);
      expect(addJobTargetUpdatedToQueue).toHaveBeenCalledWith({
        prev,
        updated,
        updatedColumns: ['reduction'],
      });
    });
  });

  describe('when deleting a target', () => {
    it('should clear any associated carbon intensity targets', async () => {
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

      /* Save carbon intensity record, pass the target so the M2M record is also created */
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

      target.carbonIntensities = await targetRepository.getRelation<CarbonIntensityEntity>(
        target,
        'carbonIntensities'
      );

      /* Assert Target and CarbIntensities have been saved + linked  */
      expect(target.carbonIntensities).toHaveLength(1);

      await targetRepository.remove([target]);

      expect(await targetRepository.find()).toHaveLength(0);
      expect(
        await connection.query(
          'SELECT COUNT(*) as count FROM CARBON_INTENSITY_TARGET'
        )
      ).toEqual([{ count: 0 }]);
      expect(addJobTargetDeletedToQueue).toHaveBeenCalledTimes(1);
      expect(addJobTargetDeletedToQueue).toHaveBeenCalledWith(target);
    });

    it('should not delete the associated carbon intensity', async () => {
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

      /* Save carbon intensity record, pass the target so the M2M record is also created */
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

      target.carbonIntensities = await targetRepository.getRelation<CarbonIntensityEntity>(
        target,
        'carbonIntensities'
      );

      /* Assert Target and CarbIntensities have been saved + linked  */
      expect(target?.carbonIntensities).toHaveLength(1);

      await targetRepository.remove([target]);
      expect(await carbonIntensityRepository.find()).toHaveLength(1);
      expect(addJobTargetDeletedToQueue).toHaveBeenCalledTimes(1);
      expect(addJobTargetDeletedToQueue).toHaveBeenCalledWith(target);
    });
  });
});
