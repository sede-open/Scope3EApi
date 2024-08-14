import { SolutionInterest } from '../types';
import { ResolverFunction } from './types';

type SolutionInterestsResolverType = {
  Query: {
    solutionInterests: ResolverFunction<undefined, SolutionInterest[]>;
  };
};

export const solutionInterestsResolvers: SolutionInterestsResolverType = {
  Query: {
    async solutionInterests(_, args, context) {
      return context.controllers.solutionInterests.findAll(undefined, context);
    },
  },
};
