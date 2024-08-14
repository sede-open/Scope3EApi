import { logger } from '../../utils/logger';
import { EventSubscriber, RemoveEvent } from 'typeorm';
import { CarbonIntensityEntity } from '../../entities/CarbonIntensity';
import { TargetRepository } from '../../repositories/TargetRepository';
import { CarbonIntensityRepository } from '../../repositories/CarbonIntensityRepository';
import { TargetEntity } from '../../entities/Target';
import { TargetScopeType } from '../../types';
import { EntitySubscriberInterfaceBase } from '../../utils/EntitySubscriberInterfaceBase';

const childLogger = logger.child({ source: 'CarbonIntensityEntitySubscriber' });

@EventSubscriber()
export class CarbonIntensityEntitySubscriber extends EntitySubscriberInterfaceBase {
  constructor() {
    super();
  }

  listenTo() {
    return CarbonIntensityEntity;
  }

  async beforeRemove({
    connection,
    entity,
  }: RemoveEvent<CarbonIntensityEntity>) {
    if (!entity) {
      return;
    }
    const targetRepository = connection.getCustomRepository(TargetRepository);
    const carbonIntensityRepository = connection.getCustomRepository(
      CarbonIntensityRepository
    );

    entity.targets = await carbonIntensityRepository.getRelation<TargetEntity>(
      entity,
      'targets'
    );

    if (entity.targets?.length) {
      const relatedTargets = entity.targets;

      /* Set targets to empty array and then commit -- TypeORM will cleanup any records in the join table. */
      entity.targets = [];
      await entity.save();

      /**
       * Load all intensities associated with the target (there may be others besides the one we are deleting.)
       */
      await Promise.all(
        relatedTargets.map(async (target) => {
          target.carbonIntensities = await targetRepository.getRelation<CarbonIntensityEntity>(
            target,
            'carbonIntensities'
          );
        })
      );

      /**
       *  Once records in the join table are deleted, we can delete the TARGET, but only if it is not
       *  linked to other carbon intensities.
       *
       *  eg.
       *  If We are Deleting Carb Intensity A, and Target X is associated to Intensity A _only_, we can delete.
       *
       *  If We are Deleting Carb Intensity A, and Target X is associated to Intensity A _and_ Intensity B, we cannot delete.
       */
      const targetsToDelete = relatedTargets.filter((target) => {
        return !target.carbonIntensities?.some(
          (carbonIntensity) => carbonIntensity.id !== entity.id
        );
      });

      const scope3TargetsToDelete = (
        await Promise.all(
          targetsToDelete.map(async (target) => {
            const { companyId, targetType } = target;

            return targetRepository.findOne({
              where: {
                companyId,
                targetType,
                scopeType: TargetScopeType.Scope_3,
              },
            });
          })
        )
      ).filter((target) => !!target) as TargetEntity[];

      childLogger.info(
        {
          carbonIntensityDeletion: entity.id,
          targetDeletions: [
            ...targetsToDelete.map((target) => target.id),
            ...scope3TargetsToDelete.map((target) => target.id),
          ],
        },
        'Deleting CARBON_INTENSITY, also cleaning up any associated: [CARBON_INTENSITY_TARGET, TARGET]'
      );

      await targetRepository.remove([
        ...targetsToDelete,
        ...scope3TargetsToDelete,
      ]);
    }
  }
}
