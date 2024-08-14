import { batchCompanies } from './companyLoader';
import { CompanyEntity } from '../entities/Company';

jest.mock('../entities/Company');

describe('companyLoaders', () => {
  describe('batchCompanies', () => {
    it('should return companies in the same order as ids list', async () => {
      CompanyEntity.findByIds = jest.fn();
      (CompanyEntity.findByIds as jest.Mock).mockImplementation(() => [
        { id: '1' },
        { id: '3' },
        { id: '5' },
        { id: '2' },
        { id: '4' },
      ]);
      const ids = ['1', '2', '3', '4', '5'];

      const result = await batchCompanies(ids);

      expect.assertions(ids.length);
      result.forEach((item, index) => {
        expect(item.id).toBe(ids[index]);
      });
    });
  });
});
