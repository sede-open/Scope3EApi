import { EventSubscriber, InsertEvent } from 'typeorm';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { addJobCompanyRelationshipCreatedToQueue } from '../../jobs/tasks/companyRelationship/queue';
import { EntitySubscriberInterfaceBase } from '../../utils/EntitySubscriberInterfaceBase';

@EventSubscriber()
export class CompanyRelationshipSubscriber extends EntitySubscriberInterfaceBase {
  constructor() {
    super();
  }

  listenTo() {
    return CompanyRelationshipEntity;
  }

  async afterInsert(event: InsertEvent<CompanyRelationshipEntity>) {
    await addJobCompanyRelationshipCreatedToQueue(event.entity);
  }
}
