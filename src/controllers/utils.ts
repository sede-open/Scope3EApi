import { EntityManager, ObjectType, Repository } from 'typeorm';

export const getRepository = <T>(
  entity: ObjectType<T>,
  repository: Repository<T>,
  entityManager?: EntityManager
): Repository<T> => {
  // return repository within transaction
  if (entityManager) {
    return entityManager.getRepository<T>(entity);
  }
  return repository;
};
