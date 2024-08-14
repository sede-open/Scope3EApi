import { EntityRepository, FindConditions } from 'typeorm';
import { CarbonIntensityEntity } from '../entities/CarbonIntensity';
import { ICarbonIntensity } from '../services/CarbonIntensityService/types';
import { logger } from '../utils/logger';
import { CustomRepository } from './Repository';

@EntityRepository(CarbonIntensityEntity)
export class CarbonIntensityRepository extends CustomRepository<
  CarbonIntensityEntity,
  ICarbonIntensity
> {
  async findAndRemove(
    where: FindConditions<CarbonIntensityEntity>
  ): Promise<string[]> {
    const carbonIntensities = await this.find({ where });
    const carbonIntensityIds = carbonIntensities.map(({ id }) => id);

    await this.remove(carbonIntensities);
    logger.info({ carbonIntensityIds }, 'Removed Carbon Intensities');

    return carbonIntensityIds;
  }

  async getRelation<T>(
    intensity: CarbonIntensityEntity,
    relationKey: string
  ): Promise<T[]> {
    return this.createQueryBuilder()
      .relation(CarbonIntensityEntity, relationKey)
      .of(intensity)
      .loadMany();
  }

  createEntity(
    attributes: Omit<ICarbonIntensity, 'id'>
  ): Promise<CarbonIntensityEntity> {
    return this.save(attributes);
  }
}
