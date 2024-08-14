import { TribeUsageStats, TribeJwt } from '../types';
import { ResolverFunction } from './types';

type TribeResolverType = {
  Query: {
    tribeUsageStats: ResolverFunction<undefined, TribeUsageStats>;
    tribeJwt: ResolverFunction<undefined, TribeJwt>;
  };
};

export const tribeResolvers: TribeResolverType = {
  Query: {
    async tribeUsageStats(_, args, context) {
      return context.controllers.tribe.getUsageStats(args, context);
    },
    async tribeJwt(_, args, context) {
      return context.controllers.tribe.getTribeJwt(args, context);
    },
  },
};
