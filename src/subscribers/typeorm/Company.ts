import { EventSubscriber, UpdateEvent, InsertEvent } from 'typeorm';
import { hubspotCrmClient } from '../../clients/HubspotCrmClient';
import { CompanyEntity } from '../../entities/Company';
import { addJobCompanyUpdatedToQueue } from '../../jobs/tasks/company/queue';
import { EntitySubscriberInterfaceBase } from '../../utils/EntitySubscriberInterfaceBase';

@EventSubscriber()
export class CompanyEntitySubscriber extends EntitySubscriberInterfaceBase {
  constructor() {
    super();
  }

  listenTo() {
    return CompanyEntity;
  }

  async afterInsert(event: InsertEvent<CompanyEntity>) {
    await hubspotCrmClient.createCompany(event.entity, event.manager);
  }

  async afterUpdate(event: UpdateEvent<CompanyEntity>) {
    const updatedColumns = event.updatedColumns.map(
      ({ propertyName }) => propertyName as keyof CompanyEntity
    );
    // Happens after a new company is created
    if (!event.entity || !updatedColumns.length) {
      return;
    }

    await addJobCompanyUpdatedToQueue({
      prev: event.databaseEntity,
      updated: event.entity,
      updatedColumns,
    });
  }
}
