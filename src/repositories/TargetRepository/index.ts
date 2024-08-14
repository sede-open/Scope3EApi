import { EntityRepository } from 'typeorm';
import { CarbonIntensityEntity } from '../../entities/CarbonIntensity';
import { TargetEntity } from '../../entities/Target';
import { ITarget } from '../../services/TargetService/types';
import { TargetScopeType, TargetType } from '../../types';
import { CustomRepository } from '../Repository';

@EntityRepository(TargetEntity)
export class TargetRepository extends CustomRepository<TargetEntity, ITarget> {
  /**
   * @param target An entity instance without some relationship loaded
   * @param relationKey The name of the relation as defined on the entity
   * @returns An array of associated entities
   *
   * ```
   * customer.products = await product.getRelation<ProductEntity>(customer, 'products')
   * ```
   */
  async getRelation<T>(
    target: TargetEntity,
    relationKey: string
  ): Promise<T[]> {
    return this.createQueryBuilder()
      .relation(TargetEntity, relationKey)
      .of(target)
      .loadMany();
  }

  async createAbsoluteTargetScope1And2(
    absolute: Omit<ITarget, 'scopeType' | 'targetType' | 'id'>
  ) {
    return this.createEntity({
      companyId: absolute.companyId,
      strategy: absolute.strategy,
      year: absolute.year,
      reduction: absolute.reduction,
      targetType: TargetType.Absolute,
      includeCarbonOffset: absolute.includeCarbonOffset,
      scopeType: TargetScopeType.Scope_1_2,
      createdBy: absolute.createdBy,
      privacyType: absolute.privacyType,
    });
  }

  async createIntensityTargetScope1And2(
    intensity: Omit<ITarget, 'scopeType' | 'targetType' | 'id'>,
    carbonIntensities: CarbonIntensityEntity[] = []
  ) {
    return this.createEntity(
      {
        companyId: intensity.companyId,
        strategy: intensity.strategy,
        year: intensity.year,
        reduction: intensity.reduction,
        targetType: TargetType.Intensity,
        includeCarbonOffset: intensity.includeCarbonOffset,
        scopeType: TargetScopeType.Scope_1_2,
        createdBy: intensity.createdBy,
        privacyType: intensity.privacyType,
      },
      carbonIntensities
    );
  }

  createEntity(
    attributes: Omit<ITarget, 'id'>,
    carbonIntensities: CarbonIntensityEntity[] = []
  ): Promise<TargetEntity> {
    const intensityEntity = this.create({
      companyId: attributes.companyId,
      strategy: attributes.strategy,
      year: attributes.year,
      reduction: attributes.reduction,
      targetType: attributes.targetType,
      includeCarbonOffset: attributes.includeCarbonOffset,
      scopeType: attributes.scopeType,
      createdBy: attributes.createdBy,
      privacyType: attributes.privacyType,
      carbonIntensities,
    });
    return intensityEntity.save();
  }
}
