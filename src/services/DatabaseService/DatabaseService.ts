import { Connection, EntityManager, ObjectType } from 'typeorm';
import { getOrCreateDBConnection } from '../../dbConnection';
import { logger } from '../../utils/logger';

export class DatabaseService {
  private static connection: Connection;
  private entityManager?: EntityManager = undefined;

  public async getConnection(): Promise<Connection> {
    if (DatabaseService.connection instanceof Connection) {
      return DatabaseService.connection;
    }

    DatabaseService.connection = await getOrCreateDBConnection();
    return DatabaseService.connection;
  }

  public async transaction<T>(
    callback: (entityManager: EntityManager) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    const entityManager = connection.createEntityManager();
    return entityManager.transaction(async (transactionalEntityManager) => {
      this.setEntityManager(transactionalEntityManager);
      try {
        /** Be sure to await the callback here -- else finally will not execute */
        const value = await callback(transactionalEntityManager);
        return value;
      } catch (error) {
        logger.error(error);
        throw error;
      } finally {
        this.clearEntityManager();
      }
    });
  }

  public setEntityManager(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public clearEntityManager() {
    this.entityManager = undefined;
  }

  public getEntityManager() {
    return this.entityManager;
  }

  public async getRepository<T>(repository: ObjectType<T>): Promise<T> {
    if (this.entityManager) {
      return this.entityManager.getCustomRepository<T>(repository);
    }
    const connection = await this.getConnection();
    return connection.getCustomRepository<T>(repository);
  }
}
