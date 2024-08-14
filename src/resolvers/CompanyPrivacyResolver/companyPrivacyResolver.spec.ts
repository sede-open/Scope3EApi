import { gql } from 'apollo-server-express';
import { Repository } from 'typeorm';
import { getApolloServer } from '../../apollo';
import { authenticateUser } from '../../auth';
import { getOrCreateConnection } from '../../dbConnection';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { UserEntity, UserEntityWithRoles } from '../../entities/User';
import { createCarbonIntensityMock } from '../../mocks/carbonIntensities';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { getCorporateEmissionAccessMock } from '../../mocks/emissionAccess';
import { createTargetMock } from '../../mocks/target';
import { adminUserMock, getCurrentUser } from '../../mocks/user';
import { CarbonIntensityRepository } from '../../repositories/CarbonIntensityRepository';
import { CompanyPrivacy } from '../../repositories/CompanyPrivacyRepository/types';
import { CorporateEmissionAccessRepository } from '../../repositories/CorporateEmissionAccessRepository';
import { TargetRepository } from '../../repositories/TargetRepository';

import {
  CompanyPrivacyInput,
  CompanyPrivacy as CompanyPrivacyQuery,
  CarbonIntensityMetricType,
  TargetStrategyType,
  TargetType,
  TargetScopeType,
  TargetPrivacyType,
} from '../../types';
import { getCompanyPrivacyService } from '../../utils/apolloContext';
import {
  getCompanyPrivacy,
  getCompanyPrivacyInput,
} from '../../utils/companyPrivacy';

jest.mock('../../auth');
describe('CompanyPrivacyResolver Integration', () => {
  const userMock = getCurrentUser({});

  const createCompanyPrivacy = gql`
    mutation($input: CompanyPrivacyInput!) {
      createCompanyPrivacy(input: $input) {
        id
        companyId
        allPlatform
        customerNetwork
        supplierNetwork
      }
    }
  `;

  const updateCompanyPrivacy = gql`
    mutation($input: CompanyPrivacyInput!) {
      updateCompanyPrivacy(input: $input) {
        id
        companyId
        allPlatform
        customerNetwork
        supplierNetwork
      }
    }
  `;

  const companyPrivacyQuery = gql`
    query {
      companyPrivacy {
        id
        companyId
        allPlatform
        customerNetwork
        supplierNetwork
      }
    }
  `;

  const companyDataPrivacyCompletenessQuery = gql`
    query($companyId: UUID!) {
      companyDataPrivacyCompleteness(companyId: $companyId) {
        isComplete
        companyId
        numCorporateEmissionAccessMissing
        numIntensityTargetPrivacyTypeMissing
        numAbsoluteTargetPrivacyTypeMissing
      }
    }
  `;

  const server = getApolloServer();

  beforeAll(async () => {
    const connection = await getOrCreateConnection();
    const user = (await connection.getRepository(UserEntity).findOne({
      where: { email: adminUserMock.email },
      relations: ['company', 'roles'],
    })) as UserEntityWithRoles;

    ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
      user,
    }));
  });

  const setup = async () => {
    const beforeCompanyPrivacy: CompanyPrivacy = getCompanyPrivacy({
      companyId: userMock.companyId,
      allPlatform: true,
    });
    const service = getCompanyPrivacyService();
    return service.create(beforeCompanyPrivacy);
  };

  const teardown = async () => {
    const service = getCompanyPrivacyService();
    await service.delete({
      companyId: userMock.companyId,
    });
  };

  beforeEach(async () => {
    await teardown();
  });

  afterAll(async () => {
    await teardown();
  });

  describe('createCompanyPrivacy()', () => {
    it('should create a company privacy', async () => {
      const input: CompanyPrivacyInput = getCompanyPrivacyInput({
        allPlatform: true,
      });
      const { data, errors } = await server.executeOperation({
        query: createCompanyPrivacy,
        variables: {
          input,
        },
      });
      expect(errors).not.toBeDefined();
      const result: CompanyPrivacyQuery = data?.createCompanyPrivacy;
      expect(result).toEqual(expect.objectContaining(input));
      expect(result.id).toBeTruthy();
    });
  });

  describe('updateCompanyPrivacy()', () => {
    it('should update company privacy', async () => {
      const companyPrivacy = await setup();
      const input: CompanyPrivacyInput = getCompanyPrivacyInput({
        allPlatform: true,
      });

      const { data } = await server.executeOperation({
        query: updateCompanyPrivacy,
        variables: {
          input,
        },
      });
      const result: CompanyPrivacyQuery = data?.updateCompanyPrivacy;
      expect(result).toEqual(
        expect.objectContaining({
          id: companyPrivacy.id,
          companyId: companyPrivacy.companyId,
          ...input,
        })
      );
    });
  });

  describe('companyPrivacy()', () => {
    it('should find a company privacy', async () => {
      const companyPrivacy = await setup();
      const { data } = await server.executeOperation({
        query: companyPrivacyQuery,
      });
      const result: CompanyPrivacyQuery = data?.companyPrivacy;
      expect(companyPrivacy).toEqual(expect.objectContaining(result));
    });

    it('should return null if a company does not have a privacy entry', async () => {
      const { data } = await server.executeOperation({
        query: companyPrivacyQuery,
      });
      const result: CompanyPrivacyQuery = data?.companyPrivacy;
      expect(result).toBeNull();
    });
  });

  describe('companyDataPrivacyCompleteness()', () => {
    let corporateEmissionRepository: Repository<CorporateEmissionEntity>;
    let corporateEmissionAccessRepository: CorporateEmissionAccessRepository;
    let carbonIntensityRepository: CarbonIntensityRepository;
    let targetRepository: TargetRepository;

    const userId = adminUserMock.id.toUpperCase();
    const companyId = adminUserMock.companyId;
    const corporateEmissionId = '';
    const carbonIntensityId = '';
    const corporateEmissionAccessId = '';
    const intensityTargetScope12Id = '';
    const intensityTargetScope3Id = '';

    const teardown = async () => {
      const connection = await getOrCreateConnection();
      await connection.query('DELETE FROM CARBON_INTENSITY_TARGET');

      await targetRepository.delete({
        companyId,
      });

      carbonIntensityRepository.delete({
        emissionId: corporateEmissionId,
      });

      await corporateEmissionRepository.delete([corporateEmissionId]);
    };

    const setup = async ({
      hasCorporateEmissionAccess,
      hasTargetPrivacyType,
    }: {
      hasCorporateEmissionAccess: boolean;
      hasTargetPrivacyType: boolean;
    }) => {
      const connection = await getOrCreateConnection();
      await corporateEmissionRepository.save([
        createCorporateEmissionMock({
          id: corporateEmissionId,
          companyId,
          createdBy: userId,
          updatedBy: userId,
        }),
      ]);

      if (hasCorporateEmissionAccess) {
        await corporateEmissionAccessRepository.save([
          getCorporateEmissionAccessMock({
            id: corporateEmissionAccessId,
            emissionId: corporateEmissionId,
          }),
        ]);
      }

      await carbonIntensityRepository.save([
        createCarbonIntensityMock({
          companyId,
          emissionId: corporateEmissionId,
          id: carbonIntensityId,
          createdBy: userId,
          updatedBy: userId,
          intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
          intensityValue: 200,
        }),
      ]);

      await targetRepository.save([
        createTargetMock({
          id: intensityTargetScope12Id,
          companyId,
          createdBy: userId,
          updatedBy: userId,
          year: 2050,
          reduction: 50,
          strategy: TargetStrategyType.Aggressive,
          targetType: TargetType.Intensity,
          scopeType: TargetScopeType.Scope_1_2,
          privacyType: hasTargetPrivacyType
            ? TargetPrivacyType.Private
            : undefined,
        }),
        createTargetMock({
          id: intensityTargetScope3Id,
          companyId,
          createdBy: userId,
          updatedBy: userId,
          year: 2030,
          reduction: 20,
          strategy: TargetStrategyType.Aggressive,
          targetType: TargetType.Intensity,
          scopeType: TargetScopeType.Scope_3,
          privacyType: hasTargetPrivacyType
            ? TargetPrivacyType.Private
            : undefined,
        }),
      ]);
      await connection.query(
        'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1)',
        [carbonIntensityId, intensityTargetScope12Id]
      );
    };

    beforeAll(async () => {
      const connection = await getOrCreateConnection();
      corporateEmissionRepository = connection.getRepository(
        CorporateEmissionEntity
      );

      corporateEmissionAccessRepository = connection.getCustomRepository(
        CorporateEmissionAccessRepository
      );

      carbonIntensityRepository = connection.getCustomRepository(
        CarbonIntensityRepository
      );

      targetRepository = connection.getCustomRepository(TargetRepository);
    });

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      await teardown();

      const user = (await connection.getRepository(UserEntity).findOne({
        where: { email: adminUserMock.email },
        relations: ['company', 'roles'],
      })) as UserEntityWithRoles;

      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user,
      }));
    });

    afterAll(async () => {
      await teardown();
    });

    it('isComplete should return true when a company has no data with privacy requirements', async () => {
      const { data, errors } = await server.executeOperation({
        query: companyDataPrivacyCompletenessQuery,
        variables: {
          companyId: userMock.companyId,
        },
      });

      expect(errors).toBeUndefined();
      const result = data?.companyDataPrivacyCompleteness;

      expect(result.isComplete).toEqual(true);
    });

    it('should return isComplete true when all privacy data is populated', async () => {
      const { data, errors } = await server.executeOperation({
        query: companyDataPrivacyCompletenessQuery,
        variables: {
          companyId,
        },
      });

      await setup({
        hasCorporateEmissionAccess: true,
        hasTargetPrivacyType: true,
      });

      expect(errors).toBeUndefined();

      expect(data?.companyDataPrivacyCompleteness).toEqual({
        isComplete: true,
        numCorporateEmissionAccessMissing: 0,
        numIntensityTargetPrivacyTypeMissing: 0,
        numAbsoluteTargetPrivacyTypeMissing: 0,
        companyId,
      });
    });

    it('should return isComplete false if a company has emissions without corresponding corporateEmissionAccess', async () => {
      await setup({
        hasCorporateEmissionAccess: false,
        hasTargetPrivacyType: true,
      });

      const { data, errors } = await server.executeOperation({
        query: companyDataPrivacyCompletenessQuery,
        variables: {
          companyId,
        },
      });

      expect(errors).toBeUndefined();

      expect(data?.companyDataPrivacyCompleteness).toEqual({
        isComplete: false,
        numCorporateEmissionAccessMissing: 1,
        numIntensityTargetPrivacyTypeMissing: 0,
        numAbsoluteTargetPrivacyTypeMissing: 0,
        companyId,
      });
    });

    it('should return isComplete false if a company has a target where privacy type is null', async () => {
      await setup({
        hasCorporateEmissionAccess: true,
        hasTargetPrivacyType: false,
      });

      const { data, errors } = await server.executeOperation({
        query: companyDataPrivacyCompletenessQuery,
        variables: {
          companyId,
        },
      });

      expect(errors).toBeUndefined();

      expect(data?.companyDataPrivacyCompleteness).toEqual({
        isComplete: false,
        numCorporateEmissionAccessMissing: 0,
        numIntensityTargetPrivacyTypeMissing: 2,
        numAbsoluteTargetPrivacyTypeMissing: 0,
        companyId,
      });
    });
  });
});
