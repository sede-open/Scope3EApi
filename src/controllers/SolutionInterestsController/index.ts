import { Repository } from 'typeorm';
import { SolutionInterest, SolutionInterestsSystemName } from '../../types';
import { ControllerFunctionAsync } from '../types';
import { SolutionInterestsEntity } from '../../entities/SolutionInterests';

const SolutionInterestSortOrderMap = new Map(
  [
    SolutionInterestsSystemName.RenewablePower,
    SolutionInterestsSystemName.Recycling,
    SolutionInterestsSystemName.FuelSwitch,
    SolutionInterestsSystemName.NatureBasedSolutions,
    SolutionInterestsSystemName.CarbonCapture,
    SolutionInterestsSystemName.RenewableHeat,
    SolutionInterestsSystemName.MaterialAndProcessEfficiency,
    SolutionInterestsSystemName.BehaviourChange,
  ].map((value, index) => [value, index])
);

export class SolutionInterestsController {
  constructor(
    private solutionInterestsRepository: Repository<SolutionInterestsEntity>
  ) {}

  findAll: ControllerFunctionAsync<
    undefined,
    SolutionInterest[]
  > = async () => {
    const solutionInterests = await this.solutionInterestsRepository.find();

    return solutionInterests.sort(
      (a, b) =>
        (SolutionInterestSortOrderMap.get(a.systemName) || 0) -
        (SolutionInterestSortOrderMap.get(b.systemName) || 0)
    );
  };

  findByName: ControllerFunctionAsync<
    {
      name: string;
      systemName?: SolutionInterestsSystemName;
    },
    SolutionInterestsEntity
  > = async (args) => {
    const [solution] = await this.solutionInterestsRepository.find({
      where: { name: args.name },
    });
    return solution;
  };
}
