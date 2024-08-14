import { ApolloError } from 'apollo-server-express';
import { EntityManager, getManager, MoreThan, Repository } from 'typeorm';
import {
  CORPORATE_EMISSION_CREATED_ACTION,
  CORPORATE_EMISSION_DELETED_ACTION,
} from '../../constants/audit';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import { CorporateEmissionAccessRepository } from '../../repositories/CorporateEmissionAccessRepository';
import { CarbonIntensityService } from '../../services/CarbonIntensityService';
import { CorporateEmissionAccessService } from '../../services/CorporateEmissionAccessService';
import { CorporateEmissionService } from '../../services/CorporateEmissionService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import {
  CarbonIntensityType,
  CompanySectorType,
  CorporateCarbonIntensityComparison,
  CorporateCarbonIntensityInfo,
  CorporateEmissionRank,
  CorporateEmissionType,
  CreateCorporateEmissionInput,
  DeleteCorporateEmissionInput,
  ReductionRankType,
  Scope2Type,
  UpdateCorporateEmissionInput,
} from '../../types';
import { ControllerFunctionAsync } from '../types';
import { getRepository } from '../utils';

export const YEAR_EMISSION_EXISTS_ERROR =
  'Emission record for the selected year already exists';
export const BASELINE_EXISTS_ERROR =
  'Baseline emission record already exists for the company';
export const EMISSION_DOESNT_EXIST = 'Emission does not exist';
export const COMPANY_DOESNT_EXIST = 'Company does not exist';
export const EMISSION_ALLOCATIONS_EXIST =
  'Deletion unsuccessful. Emissions allocations from suppliers or to customers exist';

export class CorporateEmissionController {
  constructor(
    private emissionRepository: Repository<CorporateEmissionEntity>,
    private corporateEmissionAccessRepository: CorporateEmissionAccessRepository,
    private corporateEmissionService: CorporateEmissionService,
    private corporateEmissionAccessService: CorporateEmissionAccessService,
    private carbonIntensityService: CarbonIntensityService,
    private databaseService: DatabaseService
  ) {}

  private getEmissionRepository = (entityManager?: EntityManager) => {
    return getRepository(
      CorporateEmissionEntity,
      this.emissionRepository,
      entityManager
    );
  };

  findByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
      year?: number;
    },
    CorporateEmissionEntity[]
  > = async (args, context) => {
    if (context.user.companyId !== args.companyId) {
      return this.corporateEmissionService.findEmissionsConsideringAccess(
        context.user.companyId,
        args.companyId
      );
    }
    const whereOptions: {
      companyId: string;
      year?: number;
    } = {
      companyId: args.companyId,
    };

    if (args.year) {
      whereOptions.year = args.year;
    }

    const result = await this.emissionRepository.find({
      order: {
        year: 'ASC',
      },
      where: whereOptions,
      relations: ['corporateEmissionAccess'],
    });
    return result;
  };

  findBaselineByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
      relations?: string[];
    },
    CorporateEmissionEntity | undefined
  > = async ({ companyId, relations }, context) => {
    if (context.user.companyId !== companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const result = await this.emissionRepository.findOne({
      order: {
        year: 'DESC',
      },
      where: {
        companyId,
        type: CorporateEmissionType.Baseline,
      },
      relations: relations ?? [],
    });

    return result;
  };

  deleteCorporateEmission: ControllerFunctionAsync<
    DeleteCorporateEmissionInput,
    string
  > = async (args, context) => {
    const emission = await this.emissionRepository.findOne({
      where: { id: args.id },
    });

    if (!emission) {
      throw new ApolloError(EMISSION_DOESNT_EXIST);
    }

    const prevEmission = { ...emission };

    if (context.user.companyId !== emission.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const allocations = await context.controllers.emissionAllocation.findByEmissionId(
      { emissionId: args.id },
      context
    );

    if (allocations.length > 0) {
      throw new ApolloError(EMISSION_ALLOCATIONS_EXIST);
    }

    await this.emissionRepository.manager.transaction(async (entityManager) => {
      await entityManager.remove(CorporateEmissionEntity, emission);

      if (emission.verificationFileId) {
        await context.controllers.file.deleteInTransaction(
          {
            id: emission.verificationFileId,
            transactionEntityManager: entityManager,
          },
          context
        );
      }
    });

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: CORPORATE_EMISSION_DELETED_ACTION,
        previousPayload: JSON.stringify(prevEmission),
      },
      context
    );

    return prevEmission.id;
  };

  createCorporateEmissionTransaction: ControllerFunctionAsync<
    CreateCorporateEmissionInput,
    CorporateEmissionEntity
  > = async (args, context) => {
    const manager = getManager();

    return manager.transaction(async (entityManager: EntityManager) => {
      return this.createCorporateEmission(args, context, entityManager);
    });
  };

  createCorporateEmission: ControllerFunctionAsync<
    CreateCorporateEmissionInput,
    CorporateEmissionEntity
  > = async (args, context, entityManager) => {
    const emissionRepository = this.getEmissionRepository();
    if (context.user.companyId !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    if (args.type === CorporateEmissionType.Baseline) {
      const baseline = await emissionRepository.findOne({
        where: {
          type: CorporateEmissionType.Baseline,
          companyId: args.companyId,
        },
      });

      if (baseline) {
        throw new ApolloError(BASELINE_EXISTS_ERROR);
      }
    } else {
      const emissionForYear = await emissionRepository.findOne({
        where: { year: args.year, companyId: args.companyId },
      });

      if (emissionForYear) {
        throw new ApolloError(YEAR_EMISSION_EXISTS_ERROR);
      }
    }

    const emission = new CorporateEmissionEntity();
    emission.companyId = args.companyId;
    emission.type = args.type;
    emission.year = args.year;
    emission.scope1 = args.scope1;
    emission.scope2 = args.scope2;
    emission.scope3 = args.scope3 ?? undefined;
    emission.offset = args.offset ?? undefined;
    emission.verificationFileId = args.verificationFileId ?? undefined;
    emission.scope2Type = args.scope2Type ?? Scope2Type.Market;
    emission.examplePercentage = args.examplePercentage ?? undefined;
    emission.headCount = args.headCount ?? undefined;
    emission.createdBy = context.user.id;

    const newEmission = await emissionRepository.save(emission);

    const { corporateEmissionAccess: corporateEmissionAccessInput } = args;

    const createdCorporateEmissionAccess = await this.corporateEmissionAccessRepository.upsert(
      {
        emissionId: emission.id,
        publicLink: corporateEmissionAccessInput.publicLink,
        carbonIntensity: corporateEmissionAccessInput.carbonIntensity,
        carbonOffsets: corporateEmissionAccessInput.carbonOffsets,
        scope1And2: corporateEmissionAccessInput.scope1And2,
        scope3: corporateEmissionAccessInput.scope3,
      }
    );

    if (args.carbonIntensities) {
      await context.controllers.carbonIntensity.updateCarbonIntensities(
        {
          year: args.year,
          companyId: args.companyId,
          emissionId: newEmission.id,
          carbonIntensities: args.carbonIntensities,
        },
        context,
        entityManager
      );
    }
    newEmission.corporateEmissionAccess = createdCorporateEmissionAccess;
    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: CORPORATE_EMISSION_CREATED_ACTION,
        currentPayload: JSON.stringify({
          ...newEmission,
        }),
      },
      context,
      entityManager
    );

    const emissionWithAccess = await this.emissionRepository.findOneOrFail({
      where: { id: newEmission.id },
      relations: ['corporateEmissionAccess'],
    });
    return emissionWithAccess;
  };

  updateCorporateEmission: ControllerFunctionAsync<
    UpdateCorporateEmissionInput,
    CorporateEmissionEntity
  > = async (args, context) => {
    let shouldDeleteDuplicateEmission = false;
    const emission = await this.corporateEmissionService.findOne({
      where: {
        id: args.id,
      },
    });
    if (!emission) {
      throw new ApolloError(EMISSION_DOESNT_EXIST);
    }

    if (emission.companyId !== context.user.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const emissionForYear = await this.corporateEmissionService.findOne({
      where: {
        year: args.year,
        companyId: context.user.companyId,
      },
    });

    if (args.year !== emission.year) {
      if (emissionForYear && emission.type === CorporateEmissionType.Actual) {
        throw new ApolloError(YEAR_EMISSION_EXISTS_ERROR);
      } else if (
        emissionForYear &&
        emission.type === CorporateEmissionType.Baseline
      ) {
        shouldDeleteDuplicateEmission = true;
      }
    }

    const { corporateEmissionAccess: corporateEmissionAccessInput } = args;

    await this.databaseService.transaction(async () => {
      if (emissionForYear && shouldDeleteDuplicateEmission) {
        this.corporateEmissionService.deleteEntity({
          id: emissionForYear.id,
        });
      }

      if (args.year !== emission.year) {
        await this.carbonIntensityService.deleteCarbonIntensity({
          year: emission.year,
          companyId: emission.companyId,
          emissionId: emission.id,
          type: CarbonIntensityType.UserSubmitted,
        });
      }

      await this.corporateEmissionService.updateEmission({
        ...args,
        createdBy: emission.createdBy,
        companyId: emission.companyId,
        updatedBy: context.user.id,
      });

      if (args.carbonIntensities) {
        await this.carbonIntensityService.updateCarbonIntensity({
          year: args.year,
          companyId: emission.companyId,
          emissionId: emission.id,
          carbonIntensities: args.carbonIntensities,
          userId: context.user.id,
        });
      }

      await this.corporateEmissionAccessService.updateEmissionAccess(
        {
          emissionId: emission.id,
          publicLink: corporateEmissionAccessInput.publicLink,
          carbonIntensity: corporateEmissionAccessInput.carbonIntensity,
          carbonOffsets: corporateEmissionAccessInput.carbonOffsets,
          scope1And2: corporateEmissionAccessInput.scope1And2,
          scope3: corporateEmissionAccessInput.scope3,
        },
        context.user.id
      );
    });

    return this.corporateEmissionService.findOneOrFail({
      where: { id: args.id },
      relations: ['corporateEmissionAccess'],
    });
  };

  getCorporateEmissionRanks: ControllerFunctionAsync<
    { companyId: string; year: number },
    CorporateEmissionRank[]
  > = async (args, context) => {
    if (args.companyId !== context.user.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const ranks = await this.emissionRepository.query(
      `
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
          INNER JOIN [COMPANY_SECTOR] as primary_company_sector ON company.id = primary_company_sector.company_id AND primary_company_sector.type='${CompanySectorType.Primary}'
          LEFT JOIN [COMPANY_SECTOR] as secondary_company_sector ON company.id = secondary_company_sector.company_id AND secondary_company_sector.type='${CompanySectorType.Secondary}'
          INNER JOIN [SECTOR] as primary_sector ON primary_company_sector.sector_id = primary_sector.id
          LEFT JOIN [SECTOR] as secondary_sector ON secondary_company_sector.sector_id = secondary_sector.id
        WHERE ce.year = @1
        AND pe.year = @2
        AND (pe.scope_1 != 0 OR pe.scope_2 != 0)
      ) AS sub;
    `,
      [args.companyId, args.year, args.year - 1]
    );

    return ranks;
  };

  getCorporateEmissionRank: ControllerFunctionAsync<
    { companyId: string; year: number },
    CorporateEmissionRank | undefined
  > = async (args, context) => {
    if (args.companyId !== context.user.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }
    const ranks = await this.getCorporateEmissionRanks(args, context);
    return ranks.find((e) => e.rankType === ReductionRankType.Selected);
  };

  getAvgSectorIntensity: ControllerFunctionAsync<
    { businessSector: string; year: number },
    CorporateCarbonIntensityInfo
  > = async (args) => {
    const [result] = await this.emissionRepository.query(
      `
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
    `,
      [args.year, args.businessSector]
    );

    return result;
  };

  getCompanyIntensity: ControllerFunctionAsync<
    { companyId: string; year: number },
    CorporateCarbonIntensityInfo
  > = async (args) => {
    const emission = await this.emissionRepository.findOne({
      where: {
        year: args.year,
        companyId: args.companyId,
        headCount: MoreThan(0),
      },
    });

    if (emission && emission.headCount) {
      return {
        scope1: emission.scope1 / emission.headCount,
        scope2: emission.scope2 / emission.headCount,
        scope3: emission.scope3
          ? emission.scope3 / emission.headCount
          : undefined,
      };
    }

    return {
      scope1: undefined,
      scope2: undefined,
      scope3: undefined,
    };
  };

  getCarbonIntensityComparisons: ControllerFunctionAsync<
    { companyId: string; years: number[] },
    CorporateCarbonIntensityComparison[]
  > = async (args, context) => {
    if (args.companyId !== context.user.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const company = await context.controllers.company.findById(
      { id: args.companyId },
      context
    );

    if (!company) {
      throw new ApolloError(COMPANY_DOESNT_EXIST);
    }

    return Promise.all(
      args.years.map(async (year) => {
        const sectorIntensity = await this.getAvgSectorIntensity(
          {
            year,
            businessSector: company.businessSection ?? '',
          },
          context
        );
        const companyIntensity = await this.getCompanyIntensity(
          { year, companyId: company.id },
          context
        );

        return {
          year,
          sectorIntensity: {
            scope1: sectorIntensity?.scope1,
            scope2: sectorIntensity?.scope2,
            scope3: sectorIntensity?.scope3,
          },
          companyIntensity: {
            scope1: companyIntensity?.scope1,
            scope2: companyIntensity?.scope2,
            scope3: companyIntensity?.scope3,
          },
        };
      })
    );
  };

  findLatestByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
    },
    CorporateEmissionEntity | undefined
  > = async (args, context) => {
    if (context.user.companyId !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    return this.emissionRepository.findOne({
      order: {
        year: 'DESC',
      },
      where: {
        companyId: args.companyId,
      },
    });
  };
}
