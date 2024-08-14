import { Repository } from 'typeorm';

import { SolutionInterestsController } from './';
import * as solutionInterestsMocks from '../../mocks/solutionInterests';
import { IContext } from '../../apolloContext';
import { SolutionInterestsEntity } from '../../entities/SolutionInterests';

describe('SolutionInterestsController', () => {
  describe('findBySoultionInterestName()', () => {
    it('should return a solution interest name', async () => {
      const solutions = [solutionInterestsMocks.solutionInterestsMock];
      const find = jest.fn();
      const solutionInterestsRepositoryMock = ({
        find,
      } as unknown) as Repository<SolutionInterestsEntity>;
      find.mockImplementation(() => solutions);
      const controller = new SolutionInterestsController(
        solutionInterestsRepositoryMock
      );

      const result = await controller.findByName(
        { name: solutionInterestsMocks.solutionInterestsMock.name },
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        where: { name: solutions[0].name },
      });
      expect(result).toEqual(solutions[0]);
    });
  });

  describe('findAll()', () => {
    it('should return a list of solution interests, sorted by the correct order', async () => {
      const solutions = [
        solutionInterestsMocks.solutionInterestsMock,
        solutionInterestsMocks.solutionInterestsMock2,
        solutionInterestsMocks.solutionInterestsMock3,
        solutionInterestsMocks.solutionInterestsMock4,
        solutionInterestsMocks.solutionInterestsMock5,
      ];
      const find = jest.fn();
      const solutionInterestsRepositoryMock = ({
        find,
      } as unknown) as Repository<SolutionInterestsEntity>;
      find.mockImplementation(() => solutions);

      const controller = new SolutionInterestsController(
        solutionInterestsRepositoryMock
      );

      const result = await controller.findAll(
        undefined,
        (jest.fn() as unknown) as IContext
      );

      const expectedOrderedSolutions = [
        solutionInterestsMocks.solutionInterestsMock3,
        solutionInterestsMocks.solutionInterestsMock4,
        solutionInterestsMocks.solutionInterestsMock2,
        solutionInterestsMocks.solutionInterestsMock,
        solutionInterestsMocks.solutionInterestsMock5,
      ];

      expect(result).toEqual(expectedOrderedSolutions);
    });
  });
});
