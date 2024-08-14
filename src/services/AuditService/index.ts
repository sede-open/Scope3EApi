import { AuditEntity } from '../../entities/Audit';
import { AuditRepository } from '../../repositories/AuditRepository';
import { BaseService } from '../BaseService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { Audit } from './types';

export class AuditService extends BaseService<AuditEntity, Audit> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, AuditRepository);
  }

  async createEntity(
    attributes: Omit<Audit, 'currentPayload' | 'previousPayload' | 'id'>,
    currentPayload: { [key: string]: unknown },
    previousPayload: { [key: string]: unknown }
  ) {
    return this.create({
      ...attributes,
      currentPayload: JSON.stringify(currentPayload),
      previousPayload: JSON.stringify(previousPayload),
    });
  }

  /**
   * This is a helper function to track different values between objects of the same Type
   *
   * returns an updated object with changes
   **/

  objectUpdatesTracker<T>({
    keysToTrack,
    updatedObject,
    originalObject,
  }: {
    keysToTrack?: (keyof T)[];
    updatedObject: T;
    originalObject: T;
  }) {
    const previousPayload: {
      [key: string]: unknown;
    } = {};
    const currentPayload: {
      [key: string]: unknown;
    } = {};
    const keys = keysToTrack
      ? keysToTrack
      : (Object.keys(originalObject) as (keyof T)[]);
    keys.forEach((keyName) => {
      const keyNameS = keyName as string;
      if (updatedObject[keyName] !== originalObject[keyName]) {
        previousPayload[keyNameS] = originalObject[keyName];
        currentPayload[keyNameS] = updatedObject[keyName];
        originalObject[keyName] = updatedObject[keyName];
      }
    });
    return { previousPayload, currentPayload, updatedEntity: originalObject };
  }
}
