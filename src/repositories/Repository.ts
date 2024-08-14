/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectLiteral, Repository } from 'typeorm';
import { NotImplementedError } from '../errors/notImplemented';

export interface CustomRepositoryMethods<Entity, Class> {
  createEntity: (attributes: Class) => Promise<Entity>;
  updateEntity: (attributes: Class) => Promise<Entity>;
}
export interface ICustomRepository<Entity extends ObjectLiteral, Class>
  extends Repository<Entity>,
    CustomRepositoryMethods<Entity, Class> {}

export class CustomRepository<Entity extends ObjectLiteral, Class>
  extends Repository<Entity>
  implements CustomRepositoryMethods<Entity, Class> {
  async createEntity(attributes: Omit<Class, 'id'>): Promise<Entity> {
    throw new NotImplementedError('createEntity');
  }

  async updateEntity(attributes: Class): Promise<Entity> {
    throw new NotImplementedError('updateEntity');
  }
}
