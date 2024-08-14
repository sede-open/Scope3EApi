import { SolutionInterestsEntity } from '../entities/SolutionInterests';
import { batchSolutionInterests } from './solutionInterestsLoader';

jest.mock('../entities/SolutionInterests');

describe('SolutionInterestsLoader', () => {
  describe('batchSolutionInterests', () => {
    it('should return solution interests in the same order as ids list', async () => {
      SolutionInterestsEntity.findByIds = jest.fn();
      (SolutionInterestsEntity.findByIds as jest.Mock).mockImplementation(
        () => [{ id: '1' }, { id: '3' }, { id: '5' }, { id: '2' }, { id: '4' }]
      );
      const ids = ['1', '2', '3', '4', '5'];

      const result = await batchSolutionInterests(ids);

      expect.assertions(ids.length);
      result.forEach((item, index) => {
        expect(item.id).toBe(ids[index]);
      });
    });
  });
});
