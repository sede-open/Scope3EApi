import { batchCompanyUsers } from './companyUsersLoader';
import { UserEntity } from '../entities/User';

jest.mock('../entities/User');

describe('CompanyUsersLoaders', () => {
  describe('batchCompanyUsers', () => {
    it('should return company users grouped by company id', async () => {
      UserEntity.find = jest.fn();
      (UserEntity.find as jest.Mock).mockImplementation(() => [
        { id: '1', companyId: '1' },
        { id: '3', companyId: '2' },
        { id: '5', companyId: '1' },
        { id: '2', companyId: '2' },
        { id: '4', companyId: '1' },
      ]);

      const ids = ['1', '2'];

      const result = await batchCompanyUsers(ids);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.arrayContaining([
            { id: '1', companyId: '1' },
            { id: '5', companyId: '1' },
            { id: '4', companyId: '1' },
          ]),
          expect.arrayContaining([
            { id: '3', companyId: '2' },
            { id: '2', companyId: '2' },
          ]),
        ])
      );
    });
  });
});
