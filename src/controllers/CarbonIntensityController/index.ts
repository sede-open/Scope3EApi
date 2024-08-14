import { ApolloError } from 'apollo-server-express';
import { EntityManager } from 'typeorm';
import { CarbonIntensityEntity } from '../../entities/CarbonIntensity';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import { CarbonIntensityRepository } from '../../repositories/CarbonIntensityRepository';
import { CarbonIntensityMetricType, CarbonIntensityType } from '../../types';
import { ControllerFunctionAsync } from '../types';

type UpdateCarbonIntensitiesData = {
  type: CarbonIntensityMetricType;
  value: number;
};
export class CarbonIntensityController {
  constructor(private carbonIntensityRepository: CarbonIntensityRepository) {}

  private getCarbonIntensityRepository = (entityManager?: EntityManager) => {
    if (entityManager) {
      return entityManager.getCustomRepository(CarbonIntensityRepository);
    }
    return this.carbonIntensityRepository;
  };

  findAllByCompanyId: ControllerFunctionAsync<
    { companyId: string },
    CarbonIntensityEntity[]
  > = async (args, context, entityManager) => {
    const carbonIntensityRepository = this.getCarbonIntensityRepository(
      entityManager
    );

    if (context.user.companyId !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    return carbonIntensityRepository.find({
      where: {
        companyId: args.companyId,
        type: CarbonIntensityType.UserSubmitted,
      },
    });
  };

  /**
   * Function to associate a set of Carbon Intensities with a Corporate
   * Emission, the function is destructive, when provided a unique { emission,
   * year, companyId } parameter set, it will erase existing Carbon Intensities
   * for the set and save the new ones.
   */
  updateCarbonIntensities: ControllerFunctionAsync<
    {
      companyId: string;
      year: number;
      emissionId: string;
      carbonIntensities: UpdateCarbonIntensitiesData[];
    },
    CarbonIntensityEntity[]
  > = async (
    { companyId, year, emissionId, carbonIntensities },
    context,
    entityManager
  ) => {
    const carbonIntensityRepository = this.getCarbonIntensityRepository(
      entityManager
    );

    await carbonIntensityRepository.findAndRemove({
      year,
      companyId,
      emissionId,
      type: CarbonIntensityType.UserSubmitted,
    });

    const carbonIntensityEntities = carbonIntensities.map(({ type, value }) => {
      const carbonIntensity = new CarbonIntensityEntity();

      carbonIntensity.companyId = companyId;
      carbonIntensity.year = year;
      carbonIntensity.intensityMetric = type;
      carbonIntensity.intensityValue = value;
      carbonIntensity.emissionId = emissionId;
      carbonIntensity.updatedBy = context.user.id;
      carbonIntensity.createdBy = context.user.id;
      carbonIntensity.type = CarbonIntensityType.UserSubmitted;

      return carbonIntensity;
    });

    return carbonIntensityRepository.save(carbonIntensityEntities);
  };
}
