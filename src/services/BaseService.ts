import {
  EntityManager,
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  ObjectType,
} from 'typeorm';
import { CustomRepository } from '../repositories/Repository';
import { DatabaseService } from './DatabaseService/DatabaseService';

export class BaseService<Entity extends ObjectLiteral, Class> {
  constructor(
    protected databaseService: DatabaseService,
    protected repoType: ObjectType<CustomRepository<Entity, Class>>
  ) {}

  setEntityManager(entityManager: EntityManager) {
    this.databaseService.setEntityManager(entityManager);
  }

  clearEntityManager() {
    this.databaseService.clearEntityManager();
  }

  async getRepository<T>() {
    return (this.databaseService.getRepository(
      this.repoType
    ) as unknown) as Promise<T>;
  }

  async create(attributes: Omit<Class, 'id'>) {
    const repository = await this.databaseService.getRepository(this.repoType);

    return repository.createEntity(attributes);
  }

  async update(attributes: Class) {
    const repository = await this.databaseService.getRepository(this.repoType);
    return repository.updateEntity(attributes);
  }

  async delete(findConditions: FindConditions<Entity>) {
    const repository = await this.databaseService.getRepository(this.repoType);
    return repository.delete(findConditions);
  }

  async findOne(findConditions?: FindOneOptions<Entity>) {
    const repository = await this.databaseService.getRepository(this.repoType);
    return repository.findOne(findConditions);
  }

  async findOneOrFail(findConditions?: FindOneOptions<Entity>) {
    const repository = await this.databaseService.getRepository(this.repoType);
    return repository.findOneOrFail(findConditions);
  }

  async findMany(findConditions?: FindManyOptions<Entity>) {
    const repository = await this.databaseService.getRepository(this.repoType);
    return repository.find(findConditions);
  }

  async remove(entities: Entity[]) {
    const repository = await this.databaseService.getRepository(this.repoType);
    return repository.remove(entities);
  }
}
