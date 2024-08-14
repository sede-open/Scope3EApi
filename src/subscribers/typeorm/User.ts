import {
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { hubspotCrmClient } from '../../clients/HubspotCrmClient';
import { UserEntity } from '../../entities/User';
import {
  addJobUserDeletedToQueue,
  addJobUserUpdatedToQueue,
} from '../../jobs/tasks/user/queue';
import { EntitySubscriberInterfaceBase } from '../../utils/EntitySubscriberInterfaceBase';
import { logger } from '../../utils/logger';
const childLogger = logger.child({ source: 'UserEntitySubscriber' });

@EventSubscriber()
export class UserEntitySubscriber extends EntitySubscriberInterfaceBase<UserEntity> {
  constructor() {
    super();
  }

  listenTo() {
    return UserEntity;
  }

  async afterInsert(event: InsertEvent<UserEntity>) {
    await hubspotCrmClient.createContact(
      event.entity,
      event.queryRunner.data?.inviter,
      event.manager
    );
  }

  async afterUpdate(event: UpdateEvent<UserEntity>) {
    if (!event.entity) {
      return;
    }
    const updatedColumns = event.updatedColumns.map(
      ({ propertyName }) => propertyName as keyof UserEntity
    );
    // Soft delete
    if (event.entity.isDeleted) {
      await addJobUserDeletedToQueue(event.entity);
      return;
    }
    await addJobUserUpdatedToQueue({
      prev: event.databaseEntity,
      updated: event.entity,
      updatedColumns,
    });
  }

  async beforeRemove({ entity }: RemoveEvent<UserEntity>) {
    if (!entity) {
      return;
    }

    /* Set roles to empty array and then commit -- TypeORM will cleanup any records in the USER_ROLES join table. */
    entity.roles = [];
    await entity.save();

    childLogger.info(
      {
        userDeletion: entity.id,
      },
      'Deleting USER, also cleaning up any associated: [USER_ROLE]'
    );
  }
}
