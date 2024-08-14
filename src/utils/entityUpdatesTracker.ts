/* eslint-disable @typescript-eslint/no-explicit-any */
import { instanceToPlain } from 'class-transformer';
import { BaseEntity } from 'typeorm';
import { objectDifference } from './objectDifference';

interface EntityUpdatesTracker<T> {
  get: (key: string) => T | undefined;
  track: (key: string, entity: T) => void;
  diff: (updated: T, key: string) => Record<string, any> | null;
}

const sanitisePayload = (obj: Record<string, any>) => {
  const sanitised: Record<string, any> = {};

  Object.entries(obj).forEach(([k, v]: [string, any]) => {
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    ) {
      sanitised[k] = v;
    } else {
      /* Drop elements which cannot be stringified */
      return;
    }
  });

  return sanitised;
};

export const entityUpdatesTracker = <
  T extends BaseEntity
>(): EntityUpdatesTracker<T> => {
  const updates: { [key: string]: T } = {};

  const get = (key: string) => updates[key];

  const track = (key: string, entity: T) => (updates[key] = { ...entity });

  const diff = (updated: T, key: string) => {
    const stored = get(key);

    if (!stored) {
      return null;
    }

    /* Note: If you wish to track native data types (eg dates), you must add an @Transform
    decorator to the base class' field */
    return sanitisePayload(
      objectDifference(instanceToPlain(stored), instanceToPlain(updated))
    );
  };

  return { get, track, diff };
};
