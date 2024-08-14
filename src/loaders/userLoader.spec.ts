import { batchUsers } from './userLoader';
import { UserEntity } from '../entities/User';

jest.mock('../entities/User');

describe('UserLoaders', () => {
  describe('batchUsers', () => {
    it('should return Users in the same order as ids list', async () => {
      UserEntity.findByIds = jest.fn();
      (UserEntity.findByIds as jest.Mock).mockImplementation(() => [
        { id: '1' },
        { id: '3' },
        { id: '5' },
        { id: '2' },
        { id: '4' },
      ]);
      const ids = ['1', '2', '3', '4', '5'];

      const result = await batchUsers(ids);

      expect.assertions(ids.length);
      result.forEach((item, index) => {
        expect(item.id).toBe(ids[index]);
      });
    });
  });
});
