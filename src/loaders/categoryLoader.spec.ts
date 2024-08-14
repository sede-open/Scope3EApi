import { batchCategories } from './categoryLoader';
import { CategoryEntity } from '../entities/Category';

jest.mock('../entities/Category');

describe('companyLoaders', () => {
  describe('batchcategories', () => {
    it('should return categories in the same order as ids list', async () => {
      CategoryEntity.findByIds = jest.fn();
      (CategoryEntity.findByIds as jest.Mock).mockImplementation(() => [
        { id: '1' },
        { id: '3' },
        { id: '5' },
        { id: '2' },
        { id: '4' },
      ]);
      const ids = ['1', '2', '3', '4', '5'];

      const result = await batchCategories(ids);

      expect.assertions(ids.length);
      result.forEach((item, index) => {
        expect(item.id).toBe(ids[index]);
      });
    });
  });
});
