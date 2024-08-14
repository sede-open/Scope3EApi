/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityManager } from 'typeorm';
import { CompanyPrivacyRepository } from '../repositories/CompanyPrivacyRepository';
import { CustomRepositoryMethods } from '../repositories/Repository';
import { getCompanyPrivacy } from '../utils/companyPrivacy';
import { DatabaseService } from './DatabaseService/DatabaseService';
import { BaseService } from './BaseService';

describe('Service', () => {
  const repositoryMock: CustomRepositoryMethods<any, any> = {
    async createEntity(attributes: any) {
      return attributes;
    },
    async updateEntity(attributes: any) {
      return attributes;
    },
  };

  const entityManagerMock = jest.fn();
  const clearManagerMock = jest.fn();
  const databaseServiceMock = ({
    getRepository: () => {
      return repositoryMock;
    },
    setEntityManager: entityManagerMock,
    clearEntityManager: clearManagerMock,
  } as unknown) as DatabaseService;

  describe('create()', () => {
    it('should create entity', async () => {
      const service = new BaseService(
        databaseServiceMock,
        CompanyPrivacyRepository
      );
      const genericData = getCompanyPrivacy();
      const result = await service.create(genericData);
      expect(result).toEqual(genericData);
    });
  });

  describe('update()', () => {
    it('should update entity', async () => {
      const service = new BaseService(
        databaseServiceMock,
        CompanyPrivacyRepository
      );
      const genericData = getCompanyPrivacy();
      const result = await service.update(genericData);
      expect(result).toEqual(genericData);
    });
  });

  describe('setEntityManager()', () => {
    it('should set database service entity manager and clear', () => {
      const service = new BaseService(
        databaseServiceMock,
        CompanyPrivacyRepository
      );
      service.setEntityManager(('testing' as unknown) as EntityManager);
      expect(entityManagerMock).toBeCalledWith('testing');
      service.clearEntityManager();
      expect(clearManagerMock).toBeCalledTimes(1);
    });
  });
});
