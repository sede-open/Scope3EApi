import { EventSubscriber, InsertEvent } from 'typeorm';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { addJobEmissionAllocationCreatedToQueue } from '../../jobs/tasks/emissionAllocation/queue';
import { EntitySubscriberInterfaceBase } from '../../utils/EntitySubscriberInterfaceBase';

@EventSubscriber()
export class EmissionAllocationSubscriber extends EntitySubscriberInterfaceBase {
  constructor() {
    super();
  }

  listenTo() {
    return EmissionAllocationEntity;
  }

  async afterInsert(event: InsertEvent<EmissionAllocationEntity>) {
    await addJobEmissionAllocationCreatedToQueue(event.entity);
  }
}
