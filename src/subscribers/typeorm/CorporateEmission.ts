import {
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import {
  addJobCorporateEmissionCreatedToQueue,
  addJobCorporateEmissionDeletedToQueue,
  addJobCorporateEmissionUpdatedToQueue,
} from '../../jobs/tasks/corporateEmission/queue';
import { EntitySubscriberInterfaceBase } from '../../utils/EntitySubscriberInterfaceBase';

@EventSubscriber()
export class CorporateEmissionSubscriber extends EntitySubscriberInterfaceBase {
  constructor() {
    super();
  }

  listenTo() {
    return CorporateEmissionEntity;
  }

  async afterInsert(event: InsertEvent<CorporateEmissionEntity>) {
    await addJobCorporateEmissionCreatedToQueue(event.entity);
  }

  async afterUpdate(event: UpdateEvent<CorporateEmissionEntity>) {
    const updatedColumns = event.updatedColumns.map(
      ({ propertyName }) => propertyName as keyof CorporateEmissionEntity
    );
    if (!event.entity || !updatedColumns.length) {
      return;
    }

    await addJobCorporateEmissionUpdatedToQueue({
      prev: event.databaseEntity,
      updated: event.entity,
      updatedColumns,
    });
  }

  async afterRemove(event: RemoveEvent<CorporateEmissionEntity>) {
    if (!event.entity) {
      return;
    }
    await addJobCorporateEmissionDeletedToQueue(event.entity);
  }
}
