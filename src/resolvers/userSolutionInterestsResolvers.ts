import {
  SolutionInterest,
  UpdateUserSolutionInterestsInput,
  UserSolutionInterest,
} from '../types';
import { ResolverFunction } from './types';

type UserSolutionInterestsResolverType = {
  Query: {
    userSolutionInterests: ResolverFunction<undefined, UserSolutionInterest[]>;
  };
  Mutation: {
    updateUserSolutionInterests: ResolverFunction<
      { input: UpdateUserSolutionInterestsInput },
      UserSolutionInterest[]
    >;
  };
  UserSolutionInterest: {
    solutionInterest: ResolverFunction<undefined, SolutionInterest | undefined>;
  };
};

export const userSolutionInterestsResolvers: UserSolutionInterestsResolverType = {
  Query: {
    async userSolutionInterests(_, __, context) {
      return context.controllers.userSolutionInterests.findByUserId(
        undefined,
        context
      );
    },
  },
  Mutation: {
    async updateUserSolutionInterests(_, args, context) {
      return context.controllers.userSolutionInterests.updateUserSolutionInterests(
        { ...args.input },
        context
      );
    },
  },
  UserSolutionInterest: {
    async solutionInterest({ solutionInterestId }, _, { loaders }) {
      return loaders.solutionInterests.load(solutionInterestId);
    },
  },
};
