import { batchFiles } from './fileLoader';
import { FileEntity } from '../entities/File';

jest.mock('../entities/File');

describe('fileLoaders', () => {
  describe('batchFiles', () => {
    it('should return files in the same order as ids list', async () => {
      FileEntity.findByIds = jest.fn();
      (FileEntity.findByIds as jest.Mock).mockImplementation(() => [
        { id: '1' },
        { id: '3' },
        { id: '5' },
        { id: '2' },
        { id: '4' },
      ]);
      const ids = ['1', '2', '3', '4', '5'];

      const result = await batchFiles(ids);

      expect.assertions(ids.length);
      result.forEach((item, index) => {
        expect(item.id).toBe(ids[index]);
      });
    });
  });
});
