import { logger } from '../../utils/logger';
import {
  EventSubscriber,
  RemoveEvent,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { TargetEntity } from '../../entities/Target';
import {
  addJobTargetCreatedToQueue,
  addJobTargetDeletedToQueue,
  addJobTargetUpdatedToQueue,
} from '../../jobs/tasks/target/queue';
import { EntitySubscriberInterfaceBase } from '../../utils/EntitySubscriberInterfaceBase';

const childLogger = logger.child({ source: 'TargetEntitySubscriber' });

@EventSubscriber()
export class TargetEntitySubscriber extends EntitySubscriberInterfaceBase {
  constructor() {
    super();
  }

  listenTo() {
    return TargetEntity;
  }

  async afterInsert(event: InsertEvent<TargetEntity>) {
    await addJobTargetCreatedToQueue(event.entity);
  }

  async afterUpdate(event: UpdateEvent<TargetEntity>) {
    if (!event.entity) {
      return;
    }

    const updatedColumns = event.updatedColumns.map(
      ({ propertyName }) => propertyName as keyof TargetEntity
    );

    await addJobTargetUpdatedToQueue({
      prev: event.databaseEntity,
      updated: event.entity,
      updatedColumns,
    });
  }

  async beforeRemove({ entity }: RemoveEvent<TargetEntity>) {
    if (!entity) {
      return;
    }

    /* Set targets to empty array and then commit -- TypeORM will cleanup any records in the join table. */
    entity.carbonIntensities = [];
    await entity.save();

    childLogger.info(
      {
        targetDeletion: entity.id,
      },
      'Deleting TARGET, also cleaning up any associated: [CARBON_INTENSITY_TARGET]'
    );

    await addJobTargetDeletedToQueue(entity);
  }
}
