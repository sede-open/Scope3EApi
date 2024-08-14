import { InviteCompanyEmailInput } from '../types';
import { ResolverFunction } from './types';

type InviteCompanyResolverType = {
  Mutation: {
    inviteCompanyEmail: ResolverFunction<
      { input: InviteCompanyEmailInput },
      void
    >;
  };
};

export const inviteCompanyResolvers: InviteCompanyResolverType = {
  Mutation: {
    async inviteCompanyEmail(_, args, context) {
      return context.controllers.inviteCompany.inviteCompanyEmail(
        args.input,
        context
      );
    },
  },
};
