import { Repository } from 'typeorm';
import {
  BASELINE_EXISTS_ERROR,
  COMPANY_DOESNT_EXIST,
  CorporateEmissionController,
  EMISSION_ALLOCATIONS_EXIST,
  EMISSION_DOESNT_EXIST,
  YEAR_EMISSION_EXISTS_ERROR,
} from '.';
import { IContext } from '../../apolloContext';
import { CORPORATE_EMISSION_CREATED_ACTION } from '../../constants/audit';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { CorporateEmissionAccessEntity } from '../../entities/CorporateEmissionAccess';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import { companyMock } from '../../mocks/company';
import { actualMock, baselineMock } from '../../mocks/emission';
import {
  adminUserMock,
  supplierEditorUserMock,
  supportUserMock,
} from '../../mocks/user';
import { CorporateEmissionAccessRepository } from '../../repositories/CorporateEmissionAccessRepository';
import { CarbonIntensityService } from '../../services/CarbonIntensityService';
import { CorporateEmissionAccessService } from '../../services/CorporateEmissionAccessService';
import { CorporateEmissionService } from '../../services/CorporateEmissionService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import {
  CarbonIntensityType,
  CorporateEmissionType,
  ReductionRankType,
  Scope2Type,
  UpdateCorporateEmissionInput,
} from '../../types';
type CorporateEmissionControllerConstructor = ConstructorParameters<
  typeof CorporateEmissionController
>;
describe('EmissionController', () => {
  const corporateEmissionAccessSaveMock = jest.fn();
  const corporateEmissionAccessCreateOrUpdateMock = jest.fn(() => ({
    ...baselineMock.corporateEmissionAccess,
    emissionId: baselineMock.id,
  }));

  const corporateEmissionAccessRepositoryMock = ({
    save: corporateEmissionAccessSaveMock,
    findOne: jest.fn(() => ({})),
    upsert: corporateEmissionAccessCreateOrUpdateMock,
  } as unknown) as CorporateEmissionAccessRepository;

  beforeEach(() => {
    corporateEmissionAccessSaveMock.mockClear();
    corporateEmissionAccessCreateOrUpdateMock.mockClear();
  });

  const createCorporateEmissionControllerMock = ({
    emissionRepository,
    corporateEmissionAccessRepository,
    corporateEmissionService = (jest.fn() as unknown) as CorporateEmissionService,
    corporateEmissionAccessService = (jest.fn() as unknown) as CorporateEmissionAccessService,
    carbonIntensityService = (jest.fn() as unknown) as CarbonIntensityService,
    databaseService = ({
      transaction: (cb: () => void) => {
        cb();
      },
    } as unknown) as DatabaseService,
  }: {
    emissionRepository: CorporateEmissionControllerConstructor[0];
    corporateEmissionAccessRepository: CorporateEmissionControllerConstructor[1];
    corporateEmissionService?:
      | CorporateEmissionControllerConstructor[2]
      | Partial<CorporateEmissionControllerConstructor[2]>;
    corporateEmissionAccessService?:
      | CorporateEmissionControllerConstructor[3]
      | Partial<CorporateEmissionControllerConstructor[3]>;
    carbonIntensityService?:
      | CorporateEmissionControllerConstructor[4]
      | Partial<CorporateEmissionControllerConstructor[4]>;
    databaseService?:
      | CorporateEmissionControllerConstructor[5]
      | Partial<CorporateEmissionControllerConstructor[5]>;
  }) => {
    return new CorporateEmissionController(
      emissionRepository,
      corporateEmissionAccessRepository,
      corporateEmissionService as CorporateEmissionControllerConstructor[2],
      corporateEmissionAccessService as CorporateEmissionControllerConstructor[3],
      carbonIntensityService as CorporateEmissionControllerConstructor[4],
      databaseService as CorporateEmissionControllerConstructor[5]
    );
  };

  describe('findByCompanyId()', () => {
    it('should return emissions for a company', async () => {
      const find = jest.fn();
      const emissionRepositoryMock = ({
        find,
      } as unknown) as Repository<CorporateEmissionEntity>;
      find.mockImplementation(() => [baselineMock, actualMock]);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const result = await controller.findByCompanyId(
        { companyId: companyMock.id },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: companyMock.id },
        })
      );
      expect(result).toEqual([baselineMock, actualMock]);
    });

    it('should return emissions for a company and year', async () => {
      const year = 2020;
      const find = jest.fn();
      const emissionRepositoryMock = ({
        find,
      } as unknown) as Repository<CorporateEmissionEntity>;
      find.mockImplementation(() => [baselineMock, actualMock]);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const result = await controller.findByCompanyId(
        { companyId: companyMock.id, year },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: companyMock.id, year },
        })
      );
      expect(result).toEqual([baselineMock, actualMock]);
    });

    it('should throw an error if the user does not belong to the company (admin role)', async () => {
      const find = jest.fn();
      const emissionRepositoryMock = ({
        find,
      } as unknown) as Repository<CorporateEmissionEntity>;
      const mockContext = ({
        user: adminUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      try {
        await controller.findByCompanyId(
          { companyId: companyMock.id },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should call findEmissionsConsideringAccess if the user does not belong to the company (support role)', async () => {
      const someResult = {};
      const user = { ...supportUserMock, companyId: 'some-company-id' };
      const emissionRepositoryMock = ({
        findOne: jest.fn(),
      } as unknown) as Repository<CorporateEmissionEntity>;
      const findEmissionsConsideringAccess = jest
        .fn()
        .mockResolvedValueOnce({});
      const emissionServiceMock = ({
        findEmissionsConsideringAccess,
      } as unknown) as CorporateEmissionService;
      const mockContext = ({
        user,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
        corporateEmissionService: emissionServiceMock,
      });

      const result = await controller.findByCompanyId(
        { companyId: companyMock.id },
        mockContext
      );

      expect(findEmissionsConsideringAccess).toHaveBeenCalledWith(
        user.companyId,
        companyMock.id
      );
      expect(result).toEqual(someResult);
      expect(emissionRepositoryMock.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findBaselineByCompanyId()', () => {
    it('should return baseline emission entry for a company', async () => {
      const findOne = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementation(() => baselineMock);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const result = await controller.findBaselineByCompanyId(
        { companyId: companyMock.id },
        mockContext
      );

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companyId: companyMock.id,
            type: CorporateEmissionType.Baseline,
          },
        })
      );
      expect(result).toEqual(baselineMock);
    });
  });

  describe('deleteEmission', () => {
    it('should delete emission and return its id', async () => {
      const findOne = jest.fn();
      const transaction = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
        manager: {
          transaction,
        },
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementationOnce(() => ({ ...baselineMock }));

      const findByEmissionId = jest.fn();
      findByEmissionId.mockImplementationOnce(() => []);

      const saveAuditTrail = jest.fn();
      const mockContext = ({
        user: supplierEditorUserMock,
        controllers: {
          audit: { saveAuditTrail },
          emissionAllocation: { findByEmissionId },
        },
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const result = await controller.deleteCorporateEmission(
        { id: baselineMock.id },
        mockContext
      );

      expect(result).toBe(baselineMock.id);
    });

    it('should throw an error if the user does not belong to the emission company', async () => {
      const findOne = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementationOnce(() => ({
        ...baselineMock,
        companyId: 'RANDOM_COMPANY_ID',
      }));

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      try {
        await controller.deleteCorporateEmission(
          { id: baselineMock.id },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should throw an error if the emission does not exist', async () => {
      const emissionRepositoryMock = ({
        findOne: () => undefined,
      } as unknown) as Repository<CorporateEmissionEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      try {
        await controller.deleteCorporateEmission(
          { id: baselineMock.id },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(EMISSION_DOESNT_EXIST);
      }
    });

    it('should throw an error if emission allocation exists', async () => {
      const findOne = jest.fn();
      const transaction = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
        manager: {
          transaction,
        },
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementationOnce(() => ({
        ...baselineMock,
      }));

      const findByEmissionId = jest.fn();
      findByEmissionId.mockImplementationOnce(() => [actualMock]);

      const saveAuditTrail = jest.fn();
      const mockContext = ({
        user: supplierEditorUserMock,
        controllers: {
          audit: { saveAuditTrail },
          emissionAllocation: { findByEmissionId },
        },
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      try {
        await controller.deleteCorporateEmission(
          { id: baselineMock.id },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(EMISSION_ALLOCATIONS_EXIST);
      }
    });
  });

  describe('createCorporateEmission()', () => {
    it('should save and return an emission for a company', async () => {
      CorporateEmissionAccessEntity.save = jest.fn();
      const {
        type: emissionType,
        companyId,
        scope1,
        scope2,
        scope3,
        offset,
        examplePercentage,
        headCount,
        year,
        verificationFileId,
        corporateEmissionAccess,
      } = baselineMock;

      const saveAuditTrail = jest.fn();
      const save = jest.fn();
      const emissionRepositoryMock = ({
        save,
        findOne: (params: { relations: object }) => {
          if (params.relations) {
            return baselineMock;
          }
          return undefined;
        },
        findOneOrFail: (params: { relations: object }) => {
          if (params.relations) {
            return baselineMock;
          }
          return undefined;
        },
        manager: {
          transaction: jest.fn(),
        },
      } as unknown) as Repository<CorporateEmissionEntity>;
      save.mockImplementation(() => baselineMock);
      const mockContext = ({
        user: supplierEditorUserMock,
        controllers: { audit: { saveAuditTrail } },
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const savedEmission = await controller.createCorporateEmission(
        {
          type: emissionType,
          companyId,
          scope1,
          scope2,
          scope3,
          scope2Type: Scope2Type.Market,
          offset,
          examplePercentage,
          headCount,
          year,
          verificationFileId,
          corporateEmissionAccess,
        },
        mockContext
      );

      expect(save).toBeCalledWith({
        type: emissionType,
        companyId,
        scope1,
        scope2,
        scope3: undefined,
        scope2Type: Scope2Type.Market,
        offset: undefined,
        examplePercentage,
        year,
        headCount,
        verificationFileId,
        createdBy: supplierEditorUserMock.id,
      });

      expect(saveAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: supplierEditorUserMock.id,
          action: CORPORATE_EMISSION_CREATED_ACTION,
          currentPayload: JSON.stringify(savedEmission),
        }),
        mockContext,
        undefined /* No transaction instance in unit test */
      );
    });

    it('should throw an error if emission already exists for the year for the company', async () => {
      const {
        type: emissionType,
        companyId,
        scope1,
        scope2,
        scope3,
        offset,
        examplePercentage,
        headCount,
        year,
      } = actualMock;

      const findOne = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementation(() => actualMock);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      try {
        await controller.createCorporateEmission(
          {
            type: emissionType,
            companyId,
            scope1,
            scope2,
            scope3,
            scope2Type: Scope2Type.Market,
            offset,
            examplePercentage,
            headCount,
            year,
            corporateEmissionAccess: baselineMock.corporateEmissionAccess,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(YEAR_EMISSION_EXISTS_ERROR);
        expect(findOne).toHaveBeenCalledWith({
          where: { companyId, year },
        });
      }
    });

    it('should throw an error if baseline already exists for the company', async () => {
      const {
        type: emissionType,
        companyId,
        scope1,
        scope2,
        scope3,
        offset,
        examplePercentage,
        headCount,
        year,
      } = baselineMock;

      const findOne = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementation(() => baselineMock);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      try {
        await controller.createCorporateEmission(
          {
            type: emissionType,
            companyId,
            scope1,
            scope2,
            scope3,
            scope2Type: Scope2Type.Market,
            offset,
            examplePercentage,
            headCount,
            year,
            corporateEmissionAccess: baselineMock.corporateEmissionAccess,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(BASELINE_EXISTS_ERROR);
        expect(findOne).toHaveBeenCalledWith({
          where: { companyId, type: CorporateEmissionType.Baseline },
        });
      }
    });
  });

  describe('updateCorporateEmission()', () => {
    const updatedFields: UpdateCorporateEmissionInput = {
      id: baselineMock.id,
      year: 2020,
      scope1: 1,
      scope2: 2,
      scope3: 3,
      offset: 4,
      scope2Type: Scope2Type.Location,
      examplePercentage: 5,
      headCount: 150,
      verificationFileId: baselineMock.verificationFileId,
      corporateEmissionAccess: baselineMock.corporateEmissionAccess,
      type: baselineMock.type,
    };

    it('should update and return an emission', async () => {
      const emissionForYear = { ...baselineMock, year: 1998, id: 'test-id' };
      const findOneMock = jest
        .fn()
        .mockImplementationOnce(() => baselineMock)
        .mockImplementationOnce(() => emissionForYear);
      const corporateEmissionServiceMock: Partial<CorporateEmissionService> = {
        findOne: findOneMock,
        findOneOrFail: jest.fn().mockReturnValue(updatedFields),
        setEntityManager: jest.fn(),
        deleteEntity: jest.fn(),
        updateEmission: jest.fn(),
        clearEntityManager: jest.fn(),
      };

      const corporateEmissionAccessServiceMock: Partial<CorporateEmissionAccessService> = {
        setEntityManager: jest.fn(),
        updateEmissionAccess: jest.fn(),
        clearEntityManager: jest.fn(),
      };

      const carbonIntensityServiceMock: Partial<CarbonIntensityService> = {
        setEntityManager: jest.fn(),
        deleteCarbonIntensity: jest.fn(),
        updateCarbonIntensity: jest.fn(),
        clearEntityManager: jest.fn(),
      };

      const emissionRepositoryMock = ({
        manager: {
          transaction: jest.fn().mockImplementation((cb) => cb()),
        },
      } as unknown) as Repository<CorporateEmissionEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
        corporateEmissionAccessService: corporateEmissionAccessServiceMock,
        corporateEmissionService: corporateEmissionServiceMock,
        carbonIntensityService: carbonIntensityServiceMock,
      });

      const result = await controller.updateCorporateEmission(
        updatedFields,
        mockContext
      );

      expect(corporateEmissionServiceMock.deleteEntity).toHaveBeenCalledWith({
        id: emissionForYear.id,
      });
      expect(
        carbonIntensityServiceMock.deleteCarbonIntensity
      ).toHaveBeenCalledWith({
        year: baselineMock.year,
        companyId: baselineMock.companyId,
        emissionId: baselineMock.id,
        type: CarbonIntensityType.UserSubmitted,
      });
      expect(corporateEmissionServiceMock.updateEmission).toHaveBeenCalledWith({
        ...updatedFields,
        createdBy: baselineMock.createdBy,
        updatedBy: mockContext.user.id,
        companyId: baselineMock.companyId,
      });
      expect(
        corporateEmissionAccessServiceMock.updateEmissionAccess
      ).toHaveBeenCalledWith(
        {
          emissionId: baselineMock.id,
          ...baselineMock.corporateEmissionAccess,
        },
        mockContext.user.id
      );
      expect(result).toEqual(updatedFields);
    });

    it('should throw an error if the emission does not exist', async () => {
      const corporateEmissionServiceMock: Partial<CorporateEmissionService> = {
        findOne: jest.fn().mockReturnValue(undefined),
      };
      const emissionRepositoryMock = (jest.fn() as unknown) as Repository<CorporateEmissionEntity>;
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
        corporateEmissionService: corporateEmissionServiceMock,
      });

      try {
        await controller.updateCorporateEmission(updatedFields, mockContext);
      } catch (err) {
        expect(err.message).toBe(EMISSION_DOESNT_EXIST);
      }
    });

    it('should throw an error if user does not belong to the company', async () => {
      const corporateEmissionServiceMock = ({
        findOne: () => ({
          ...baselineMock,
          companyId: 'OTHER_ID',
        }),
      } as unknown) as CorporateEmissionService;
      const emissionRepositoryMock = (jest.fn() as unknown) as Repository<CorporateEmissionEntity>;
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
        corporateEmissionService: corporateEmissionServiceMock,
      });

      try {
        await controller.updateCorporateEmission(updatedFields, mockContext);
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should throw an error if emission for the new year already exists for actual emission', async () => {
      const corporateEmissionServiceMock = ({
        findOne: () => ({
          ...baselineMock,
          type: CorporateEmissionType.Actual,
        }),
      } as unknown) as CorporateEmissionService;
      const emissionRepositoryMock = (jest.fn() as unknown) as Repository<CorporateEmissionEntity>;
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
        corporateEmissionService: corporateEmissionServiceMock,
      });

      try {
        await controller.updateCorporateEmission(updatedFields, mockContext);
      } catch (err) {
        expect(err.message).toBe(YEAR_EMISSION_EXISTS_ERROR);
      }
    });
  });

  describe('getEmissionRanks()', () => {
    it('should send the right sql query', async () => {
      const query = jest.fn();
      const emissionRepositoryMock = ({
        query,
      } as unknown) as Repository<CorporateEmissionEntity>;
      query.mockImplementation(() => ({
        ...baselineMock,
        type: CorporateEmissionType.Baseline,
      }));
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });
      const companyId = supplierEditorUserMock.companyId;
      const year = 2018;
      await controller.getCorporateEmissionRanks(
        { companyId, year },
        mockContext
      );

      expect(query).toHaveBeenCalledTimes(1);
      const [[querySql]] = query.mock.calls;

      expect(querySql).toMatchInlineSnapshot(`
        "
              SELECT
                RANK() OVER (ORDER BY sub.reduction_percentage ASC) AS rank,
                sub.id,
                sub.current_year as currentYear,
                sub.scope_1 as scope1,
                sub.scope_2 as scope2,
                sub.business_sector as businessSector,
                sub.sub_sector as subSector,
                sub.primary_sector AS primarySector,
                sub.secondary_sector AS secondarySector,
                sub.reduction_percentage as reductionPercentage,
                sub.rank_type as rankType,
                sub.has_verification_file as hasVerificationFile,
                sub.has_previous_year_verification_file as hasPreviousYearVerificationFile
              FROM (
                SELECT
                  ce.id,
                  company.sub_sector,
                  company.business_sector,
                  primary_sector.name as primary_sector,
                  secondary_sector.name as secondary_sector,
                  ce.year AS current_year,
                  ce.scope_1,
                  ce.scope_2,
                  (
                    (
                      (ce.scope_1 + ce.scope_2)
                      -
                      (pe.scope_1 + pe.scope_2)
                    )
                    * 100
                    / (pe.scope_1 + pe.scope_2)
                  ) AS reduction_percentage,
                  CASE
                    WHEN ce.company_id = @0 THEN 'SELECTED'
                    ELSE 'OTHER'
                  END AS rank_type,
                  CASE
                    WHEN  ce.verification_file_id IS NULL THEN (CAST (0 AS BIT))
                    ELSE (CAST (1 AS BIT))
                  END AS has_verification_file,
                  CASE
                    WHEN  pe.verification_file_id IS NULL THEN (CAST (0 AS BIT))
                    ELSE (CAST (1 AS BIT))
                  END AS has_previous_year_verification_file
                  FROM [CORPORATE_EMISSION] AS ce
                  INNER JOIN [CORPORATE_EMISSION] AS pe ON ce.company_id = pe.company_id
                  INNER JOIN [COMPANY] AS company ON company.id = ce.company_id
                  INNER JOIN [COMPANY_SECTOR] as primary_company_sector ON company.id = primary_company_sector.company_id AND primary_company_sector.type='PRIMARY'
                  LEFT JOIN [COMPANY_SECTOR] as secondary_company_sector ON company.id = secondary_company_sector.company_id AND secondary_company_sector.type='SECONDARY'
                  INNER JOIN [SECTOR] as primary_sector ON primary_company_sector.sector_id = primary_sector.id
                  LEFT JOIN [SECTOR] as secondary_sector ON secondary_company_sector.sector_id = secondary_sector.id
                WHERE ce.year = @1
                AND pe.year = @2
                AND (pe.scope_1 != 0 OR pe.scope_2 != 0)
              ) AS sub;
            "
      `);
    });

    it('should throw an error if the user does not belong to the company', async () => {
      const query = jest.fn();
      const emissionRepositoryMock = ({
        query,
      } as unknown) as Repository<CorporateEmissionEntity>;
      query.mockImplementation(() => ({
        ...baselineMock,
        type: CorporateEmissionType.Baseline,
      }));
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });
      const companyId = 'randomCompanyId';
      const year = 2018;

      try {
        await controller.getCorporateEmissionRanks(
          { companyId, year },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });
  });

  describe('getEmissionRankByCompanyId()', () => {
    it('should return company emission rank', async () => {
      const query = jest.fn();
      const emissionRepositoryMock = ({
        query,
      } as unknown) as Repository<CorporateEmissionEntity>;
      query.mockImplementation(() => ({
        ...baselineMock,
        type: CorporateEmissionType.Baseline,
      }));
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const year = 2018;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });
      controller.getCorporateEmissionRanks = jest.fn();
      (controller.getCorporateEmissionRanks as jest.Mock).mockImplementation(
        () => [
          { rank: 1, rankType: ReductionRankType.Other },
          { rank: 2, rankType: ReductionRankType.Selected },
        ]
      );

      const companyId = supplierEditorUserMock.companyId;
      const result = await controller.getCorporateEmissionRank(
        { companyId, year },
        mockContext
      );

      expect(result?.rank).toBe(2);
    });

    it('should throw an error if the user does not belong to the company', async () => {
      const query = jest.fn();
      const emissionRepositoryMock = ({
        query,
      } as unknown) as Repository<CorporateEmissionEntity>;
      query.mockImplementation(() => ({
        ...baselineMock,
        type: CorporateEmissionType.Baseline,
      }));
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const year = 2018;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const companyId = 'randomCompanyId';
      try {
        await controller.getCorporateEmissionRank(
          { companyId, year },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });
  });

  describe('getCarbonIntensityComparisons()', () => {
    it('should return carbon intensity for a given year', async () => {
      const emissionRepositoryMock = ({} as unknown) as Repository<CorporateEmissionEntity>;

      const companyFindById = jest.fn();
      const mockContext = ({
        user: supplierEditorUserMock,
        controllers: {
          company: { findById: companyFindById },
        },
      } as unknown) as IContext;

      companyFindById.mockImplementation(() => companyMock);

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      controller.getCompanyIntensity = jest.fn();
      (controller.getCompanyIntensity as jest.Mock).mockImplementation(() => ({
        scope1: 4,
        scope2: 5,
        scope3: undefined,
      }));

      controller.getAvgSectorIntensity = jest.fn();
      (controller.getAvgSectorIntensity as jest.Mock).mockImplementation(
        () => ({
          scope1: 1,
          scope2: 2,
          scope3: 3,
        })
      );

      const companyId = supplierEditorUserMock.companyId;
      const year = 2018;
      const result = await controller.getCarbonIntensityComparisons(
        { companyId, years: [year] },
        mockContext
      );

      expect(result).toHaveLength(1);
      expect(result).toEqual(
        expect.arrayContaining([
          {
            year,
            companyIntensity: { scope1: 4, scope2: 5, scope3: undefined },
            sectorIntensity: { scope1: 1, scope2: 2, scope3: 3 },
          },
        ])
      );
    });

    it('should return throw an error when user does not belong to the company', async () => {
      const emissionRepositoryMock = ({} as unknown) as Repository<CorporateEmissionEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });
      const companyId = 'randomCompanyId';
      const year = 2018;

      try {
        await controller.getCarbonIntensityComparisons(
          { companyId, years: [year] },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should return throw an error when the company does not exist', async () => {
      const emissionRepositoryMock = ({} as unknown) as Repository<CorporateEmissionEntity>;

      const companyFindById = jest.fn();
      const mockContext = ({
        user: supplierEditorUserMock,
        controllers: {
          company: { findById: companyFindById },
        },
      } as unknown) as IContext;
      companyFindById.mockImplementation(() => undefined);

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const companyId = supplierEditorUserMock.companyId;
      const year = 2018;

      try {
        await controller.getCarbonIntensityComparisons(
          { companyId, years: [year] },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(COMPANY_DOESNT_EXIST);
      }
    });
  });

  describe('getCompanyIntensity()', () => {
    it('should return company carbon intensity per head count for the year', async () => {
      const companyId = supplierEditorUserMock.companyId;
      const year = 2018;

      const findOne = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementation(() => ({ ...baselineMock, year }));

      const companyFindById = jest.fn();
      const mockContext = ({} as unknown) as IContext;

      companyFindById.mockImplementation(() => companyMock);

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      const result = await controller.getCompanyIntensity(
        { companyId, year },
        mockContext
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "scope1": 18.25328,
          "scope2": 25.28528,
          "scope3": undefined,
        }
      `);
    });

    it('should return undefined carbon intensities when company has no emission for the year', async () => {
      const companyId = supplierEditorUserMock.companyId;
      const year = 2018;

      const findOne = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementation(() => undefined);

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });
      const result = await controller.getCompanyIntensity(
        { companyId, year },
        ({} as unknown) as IContext
      );

      expect(result).toEqual({
        scope1: undefined,
        scope2: undefined,
        scope3: undefined,
      });
    });
  });

  describe('getAvgSectorIntensity()', () => {
    it('should query with emissions table with specific query', async () => {
      const businessSector = 'Logistics';
      const year = 2018;

      const query = jest.fn();
      const emissionRepositoryMock = ({
        query,
      } as unknown) as Repository<CorporateEmissionEntity>;
      query.mockImplementation(() => []);
      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });

      await controller.getAvgSectorIntensity(
        { businessSector, year },
        ({} as unknown) as IContext
      );

      expect(query).toHaveBeenCalledTimes(1);

      const [[querySql, params]] = query.mock.calls;
      expect(querySql).toMatchInlineSnapshot(`
        "
                SELECT
                  (avg.scope_1 / avg.head_count) as scope1,
                  (avg.scope_2 / avg.head_count) as scope2,
                  (avg.scope_3 / avg.head_count) as scope3
                FROM (
                  SELECT
                    AVG(emission.scope_1) as scope_1,
                    AVG(emission.scope_2) as scope_2,
                    AVG(emission.scope_3) as scope_3,
                    AVG(emission.head_count) as head_count
                  FROM CORPORATE_EMISSION as emission
                  INNER JOIN COMPANY as company
                  ON company.id = emission.company_id
                  WHERE emission.year = @0
                  AND company.business_sector = @1
                  AND head_count > 0
                ) AS avg;
            "
      `);

      expect(params).toEqual([year, businessSector]);
    });
  });

  describe('findLatestByCompanyId()', () => {
    it('should return the latest emission record for a company', async () => {
      const findOne = jest.fn();
      const emissionRepositoryMock = ({
        findOne,
      } as unknown) as Repository<CorporateEmissionEntity>;
      findOne.mockImplementation(() => actualMock);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });
      const result = await controller.findLatestByCompanyId(
        { companyId: companyMock.id },
        mockContext
      );

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: companyMock.id },
          order: {
            year: 'DESC',
          },
        })
      );
      expect(result).toEqual(actualMock);
    });

    it('should throw an error if user does not belong to the company', async () => {
      const emissionRepositoryMock = ({} as unknown) as Repository<CorporateEmissionEntity>;
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = createCorporateEmissionControllerMock({
        emissionRepository: emissionRepositoryMock,
        corporateEmissionAccessRepository: corporateEmissionAccessRepositoryMock,
      });
      try {
        await controller.findLatestByCompanyId(
          { companyId: 'some_random_company' },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });
  });
});
