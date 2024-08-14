import {
  AbsoluteTarget,
  CreateTargetInput,
  UpdateTargetInput,
  SaveTargetsInput,
  Targets,
  SimpleSuccess,
} from '../types';
import { ResolverFunction } from './types';

type TargetResolverType = {
  Query: {
    target: ResolverFunction<{ companyId: string }, AbsoluteTarget | undefined>;
    targets: ResolverFunction<{ companyId: string }, Targets>;
  };
  Mutation: {
    createTarget: ResolverFunction<
      { input: CreateTargetInput },
      AbsoluteTarget
    >;
    updateTarget: ResolverFunction<
      { input: UpdateTargetInput },
      AbsoluteTarget
    >;
    saveTargets: ResolverFunction<{ input: SaveTargetsInput }, SimpleSuccess>;
  };
};

export const targetResolvers: TargetResolverType = {
  Query: {
    async target(_, args, context) {
      return context.controllers.target.findAbsoluteTargetByCompanyId(
        {
          companyId: args.companyId,
        },
        context
      );
    },
    async targets(_, { companyId }, context) {
      return context.controllers.target.findTargetsByCompanyId(
        { companyId },
        context
      );
    },
  },
  Mutation: {
    async createTarget(_, args, context) {
      return context.controllers.target.createTarget(args.input, context);
    },
    async updateTarget(_, args, context) {
      return context.controllers.target.updateTarget(args.input, context);
    },
    async saveTargets(_, args, context) {
      return context.controllers.target.batchSaveTargets(args.input, context);
    },
  },
};
