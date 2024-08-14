import { EntityManager, EntityRepository, In } from 'typeorm';
import { getOrCreateDBConnection } from '../dbConnection';
import { UserEntity } from '../entities/User';
import { IUser } from '../services/UserService/types';
import { RoleName } from '../types';
import { createHash } from '../utils/hash';
import { CustomRepository } from './Repository';

@EntityRepository(UserEntity)
export class UserRepository extends CustomRepository<UserEntity, IUser> {
  async createEntity(attributes: Omit<IUser, 'id'>): Promise<UserEntity> {
    return this.create(attributes).save();
  }

  async deleteUsers(ids: string[]) {
    const connection = await getOrCreateDBConnection();

    if (!ids.length) {
      return;
    }

    await connection.query(
      `DELETE FROM USER_ROLE WHERE user_id IN (${ids
        .map((_, index) => `@${index}`)
        .join(', ')})`,
      ids
    );

    return this.delete({
      id: In(ids),
    });
  }

  async deleteUsersByCompanyId(companyIds: string[]) {
    const connection = await getOrCreateDBConnection();

    if (!companyIds.length) {
      return;
    }

    const users = await this.find({
      companyId: In(companyIds),
    });

    const ids = users.map((user) => user.id);

    if (!ids.length) {
      return;
    }

    await connection.query(
      `DELETE FROM USER_ROLE WHERE user_id IN (${ids
        .map((_, index) => `@${index}`)
        .join(', ')})`,
      ids
    );

    return this.delete({
      companyId: In(companyIds),
    });
  }

  async softDeleteUsers(users: UserEntity[]) {
    const connection = await getOrCreateDBConnection();

    const userIds = users.map(({ id }) => id);

    await connection.query(
      `DELETE FROM USER_ROLE WHERE user_id IN (${userIds
        .map((_, index) => `@${index}`)
        .join(', ')})`,
      userIds
    );

    const updatedUsers = users.map((user) => {
      user.firstName = '';
      user.lastName = '';
      user.email = createHash(user.email);
      user.isDeleted = true;
      return user;
    });

    return this.save(updatedUsers);
  }

  companyUsers(
    companyIds: string[],
    roleNames?: RoleName[],
    entityManager?: EntityManager
  ): Promise<UserEntity[]> {
    const query = entityManager
      ? entityManager.createQueryBuilder().from(UserEntity, 'users')
      : this.createQueryBuilder('users');

    if (roleNames?.length) {
      query.innerJoinAndSelect(
        'users.roles',
        'roles',
        'roles.name IN (:...roleNames)',
        {
          roleNames,
        }
      );
    }

    query.where(
      'users.company_id IN (:...companyIds) AND users.is_deleted = :isDeleted',
      { companyIds, isDeleted: false }
    );

    return query.getMany();
  }

  getRelation<T>(user: UserEntity, relationKey: string): Promise<T[]> {
    return this.createQueryBuilder()
      .relation(UserEntity, relationKey)
      .of(user)
      .loadMany();
  }
}
