import { batchRoles } from './roleLoader';
import { RoleEntity } from '../entities/Role';

jest.mock('../entities/Role');

describe('roleLoaders', () => {
  describe('batchRoles', () => {
    it('should return roles in the same order as ids list', async () => {
      RoleEntity.findByIds = jest.fn();
      (RoleEntity.findByIds as jest.Mock).mockImplementation(() => [
        { id: '1' },
        { id: '3' },
        { id: '5' },
        { id: '2' },
        { id: '4' },
      ]);
      const ids = ['1', '2', '3', '4', '5'];

      const result = await batchRoles(ids);

      expect.assertions(ids.length);
      result.forEach((item, index) => {
        expect(item.id).toBe(ids[index]);
      });
    });
  });
});
