import { FindConditions } from 'typeorm';
import { CarbonIntensityEntity } from '../../entities/CarbonIntensity';
import { CarbonIntensityRepository } from '../../repositories/CarbonIntensityRepository';
import { EmissionMissingIntensity } from '../../repositories/CorporateEmissionRepository/types';
import { CarbonIntensityMetricType, CarbonIntensityType } from '../../types';
import { logger } from '../../utils/logger';
import { BaseService } from '../BaseService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { DnBService } from '../DnBService';
import { ICarbonIntensity } from './types';

export class CarbonIntensityService extends BaseService<
  CarbonIntensityEntity,
  ICarbonIntensity
> {
  constructor(
    databaseService: DatabaseService,
    private dnbService: DnBService
  ) {
    super(databaseService, CarbonIntensityRepository);
  }

  async deleteCarbonIntensity(
    findConditions: FindConditions<CarbonIntensityEntity>
  ): Promise<string[]> {
    const repo = await this.getRepository<CarbonIntensityRepository>();
    return repo.findAndRemove(findConditions);
  }

  async updateCarbonIntensity({
    companyId,
    year,
    emissionId,
    userId,
    carbonIntensities,
  }: {
    companyId: string;
    year: number;
    emissionId: string;
    userId: string;
    carbonIntensities: { type: CarbonIntensityMetricType; value: number }[];
  }) {
    const carbonIntensityRepository = await this.getRepository<CarbonIntensityRepository>();

    await this.deleteCarbonIntensity({
      year,
      companyId,
      emissionId,
    });

    const carbonIntensityEntities = carbonIntensities.map(({ type, value }) => {
      const carbonIntensity = new CarbonIntensityEntity();
      carbonIntensity.companyId = companyId;
      carbonIntensity.year = year;
      carbonIntensity.intensityMetric = type;
      carbonIntensity.intensityValue = value;
      carbonIntensity.emissionId = emissionId;
      carbonIntensity.updatedBy = userId;
      carbonIntensity.createdBy = userId;
      return carbonIntensity;
    });

    return carbonIntensityRepository.save(carbonIntensityEntities);
  }

  public async createUsdOfRevenueEstimatedIntensities(
    corporateEmissions: EmissionMissingIntensity[]
  ) {
    const carbonIntensityEntities: Omit<ICarbonIntensity, 'id'>[] = [];
    const carbonIntensityRepo = await this.getRepository<CarbonIntensityRepository>();

    for await (const emission of corporateEmissions) {
      if (!emission.duns) {
        logger.info(
          { name: emission.companyName },
          'The company has no Duns id'
        );
        continue;
      }
      try {
        const dnbCompany = await this.dnbService.companyByDuns(emission.duns);
        if (!dnbCompany?.usdOfRevenue) {
          // These companies will be in loop trying to pull the data from D&B. Dev key has a limit of 1000 requests per week.
          logger.info(
            { name: emission.companyName },
            'DnB has no USD revenue data for the company'
          );
          continue;
        }

        carbonIntensityEntities.push({
          companyId: emission.companyId,
          year: emission.emissionYear,
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityValue: dnbCompany.usdOfRevenue,
          emissionId: emission.emissionId,
          type: CarbonIntensityType.Estimated,
        });
      } catch (error) {
        logger.error(
          { error, company: emission.companyName },
          'Could not fetch the D&B data'
        );
      }
    }
    return carbonIntensityRepo.save(carbonIntensityEntities);
  }

  public async createNumberOfEmployeesEstimatedIntensities(
    corporateEmissions: EmissionMissingIntensity[]
  ) {
    const carbonIntensityEntities: Omit<ICarbonIntensity, 'id'>[] = [];
    const carbonIntensityRepo = await this.getRepository<CarbonIntensityRepository>();

    for await (const emission of corporateEmissions) {
      if (!emission.duns) {
        logger.info(
          { name: emission.companyName },
          'The company has no Duns id'
        );
        continue;
      }
      try {
        const dnbCompany = await this.dnbService.companyByDuns(emission.duns);

        if (!dnbCompany?.numberOfEmployees) {
          // These companies will be in loop trying to pull the data from D&B. Dev key has a limit of 1000 requests per week.
          logger.info(
            { name: emission.companyName },
            'DnB has no number of employees data for the company'
          );
          continue;
        }

        carbonIntensityEntities.push({
          companyId: emission.companyId,
          year: emission.emissionYear,
          intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
          intensityValue: dnbCompany.numberOfEmployees,
          emissionId: emission.emissionId,
          type: CarbonIntensityType.Estimated,
        });
      } catch (error) {
        logger.error(
          { error, company: emission.companyName },
          'Could not fetch the D&B data'
        );
      }
    }
    return carbonIntensityRepo.save(carbonIntensityEntities);
  }

  public async getLatestEstimatedIntensity(
    companyId: string,
    intensityMetric: CarbonIntensityMetricType
  ) {
    const carbonIntensityRepo = await this.getRepository<CarbonIntensityRepository>();
    const [latestIntensity] = await carbonIntensityRepo.find({
      where: {
        companyId,
        intensityMetric,
        type: CarbonIntensityType.Estimated,
      },
      order: { year: 'DESC' },
      take: 1,
    });

    return latestIntensity;
  }
}
