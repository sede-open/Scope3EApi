import { EntityManager } from 'typeorm';
import { getOrCreateDBConnection } from '../../dbConnection';
import { CompanyPrivacyRepository } from '../../repositories/CompanyPrivacyRepository';
import { DatabaseService } from './DatabaseService';

jest.mock('../../dbConnection');

describe('Database Service Unit', () => {
  const connectionCustomRepositoryMock = jest.fn();
  const entityManagerMock = jest.fn();
  const entityCustomRepositoryMock = {
    getCustomRepository: entityManagerMock,
  };
  ((getOrCreateDBConnection as unknown) as jest.Mock).mockImplementation(
    () => ({
      getCustomRepository: connectionCustomRepositoryMock,
    })
  );

  beforeEach(() => {
    connectionCustomRepositoryMock.mockClear();
    entityManagerMock.mockClear();
  });

  describe('getRepository', () => {
    it('should get custom repository', async () => {
      const databaseService = new DatabaseService();
      await databaseService.getRepository(CompanyPrivacyRepository);
      expect(connectionCustomRepositoryMock).toHaveBeenCalledTimes(1);
      expect(entityManagerMock).not.toHaveBeenCalled();
    });

    it('should get repository from entity manager', async () => {
      const databaseService = new DatabaseService();
      databaseService.setEntityManager(
        (entityCustomRepositoryMock as unknown) as EntityManager
      );
      await databaseService.getRepository(CompanyPrivacyRepository);
      expect(entityManagerMock).toHaveBeenCalledTimes(1);
      expect(connectionCustomRepositoryMock).not.toHaveBeenCalled();
    });
  });
});
