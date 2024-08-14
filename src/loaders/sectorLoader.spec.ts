import { batchSectors } from './sectorLoader';
import { SectorEntity } from '../entities/Sector';

jest.mock('../entities/Sector');

describe('SectorLoaders', () => {
  describe('batchSectors', () => {
    it('should return companies in the same order as ids list', async () => {
      SectorEntity.findByIds = jest.fn();
      (SectorEntity.findByIds as jest.Mock).mockImplementation(() => [
        { id: '1' },
        { id: '3' },
        { id: '5' },
        { id: '2' },
        { id: '4' },
      ]);
      const ids = ['1', '2', '3', '4', '5'];

      const result = await batchSectors(ids);

      expect.assertions(ids.length);
      result.forEach((item, index) => {
        expect(item.id).toBe(ids[index]);
      });
    });
  });
});
