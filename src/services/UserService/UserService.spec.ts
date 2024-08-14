import { UserService } from '.';
import { UserRepository } from '../../repositories/UserRepository';
import { RoleName } from '../../types';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('UserService', () => {
  describe('findCompanyEditors', () => {
    it('returns the company editors', async () => {
      const companyId = 'some-company-id';
      const companyUsers = [
        {
          id: 'some-user-id',
          email: 'some-email',
          firstName: 'some-first-name',
          lastName: 'some-last-name',
          companyId,
          roleName: 'some-role-name',
        },
      ];
      const companyUsersMock = jest.fn().mockResolvedValue(companyUsers);
      const getRepository = jest.fn().mockResolvedValue({
        companyUsers: companyUsersMock,
      });
      const databaseService = ({
        getRepository,
      } as unknown) as DatabaseService;
      const service = new UserService(databaseService);
      const result = await service.findCompanyEditors(companyId);
      expect(getRepository).toHaveBeenCalledWith(UserRepository);
      expect(companyUsersMock).toHaveBeenCalledWith(
        [companyId],
        [RoleName.SupplierEditor]
      );
      expect(result).toEqual(companyUsers);
    });
  });
});
