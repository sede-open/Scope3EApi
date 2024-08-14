import { Transform } from 'class-transformer';
import { BaseEntity, Column, Entity } from 'typeorm';
import { UserEntity } from '../entities/User';
import { entityUpdatesTracker } from './entityUpdatesTracker';

@Entity('TEST_ENTITY')
export class TestEntity extends BaseEntity {
  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'age' })
  age!: number;

  @Column({ name: 'is_deleted' })
  isDeleted!: boolean;

  @Transform(({ value }) => (value as Date).toISOString(), {
    toPlainOnly: true,
  })
  @Column({ name: 'created_at' })
  createdAt!: Date;
}

describe(entityUpdatesTracker.name, () => {
  describe('get & track', () => {
    it('should return undefined for an untracked key', () => {
      const tracker = entityUpdatesTracker<UserEntity>();

      expect(tracker.get('unknown-key')).not.toBeDefined();
    });

    it('should return the original entity for when tracking a key', () => {
      const tracker = entityUpdatesTracker<TestEntity>();

      const myEntity = new TestEntity();

      myEntity.firstName = 'matt';

      tracker.track('my-key', myEntity);

      myEntity.firstName = 'ttam';

      const trackedEntity = tracker.get('my-key');

      expect(trackedEntity?.firstName).toEqual('matt');
    });
  });

  describe('diff', () => {
    it('should show changes in string, boolean, number and date fields', () => {
      const tracker = entityUpdatesTracker<TestEntity>();

      const myEntity = new TestEntity();

      myEntity.firstName = 'matt';
      myEntity.age = 28;
      myEntity.isDeleted = false;
      myEntity.createdAt = new Date('2022-03-29T14:00:00.500Z');

      tracker.track('my-key', myEntity);

      myEntity.firstName = 'ttam';
      myEntity.age = 29;
      myEntity.isDeleted = true;
      myEntity.createdAt = new Date('2023-01-01T00:00:00.500Z');

      expect(tracker.diff(myEntity, 'my-key')).toEqual({
        age: 29,
        firstName: 'ttam',
        isDeleted: true,
        createdAt: '2023-01-01T00:00:00.500Z',
      });
    });
  });
});
