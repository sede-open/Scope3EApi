import { BaseEntity, EntitySubscriberInterface } from 'typeorm';
import { logger } from '../utils/logger';
import { getConfig } from '../config';

export class EntitySubscriberInterfaceBase<T = BaseEntity>
  implements EntitySubscriberInterface<T> {
  constructor() {
    const { logSubscriberRegistration } = getConfig();
    if (logSubscriberRegistration) {
      logger.info(`Registered ${this.constructor.name}`);
    }
  }
}
