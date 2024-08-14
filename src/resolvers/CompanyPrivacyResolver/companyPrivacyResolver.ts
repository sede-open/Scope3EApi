import {
  ComanyDataPrivacyCompleteness,
  CompanyDataPrivacyCompletenessInput,
  CompanyPrivacy,
  CompanyPrivacyInput,
  DataShareRequest,
} from '../../types';
import { ResolverFunction } from './../types';

type CompanyPrivacyResolverType = {
  Query: {
    companyPrivacy: ResolverFunction<undefined, CompanyPrivacy | undefined>;
    companyDataPrivacyCompleteness: ResolverFunction<
      CompanyDataPrivacyCompletenessInput,
      ComanyDataPrivacyCompleteness
    >;
  };
  Mutation: {
    createCompanyPrivacy: ResolverFunction<
      { input: CompanyPrivacyInput },
      CompanyPrivacy
    >;
    updateCompanyPrivacy: ResolverFunction<
      { input: CompanyPrivacyInput },
      CompanyPrivacy
    >;
    dataShareRequest: ResolverFunction<
      { targetCompanyId: string },
      DataShareRequest
    >;
  };
};

export const companyPrivacyResolvers: CompanyPrivacyResolverType = {
  Query: {
    async companyPrivacy(_, _args, context) {
      return context.controllers.companyPrivacy.findOne(context);
    },
    async companyDataPrivacyCompleteness(_, { companyId }, context) {
      return context.controllers.companyPrivacy.companyDataPrivacyCompleteness(
        { companyId },
        context
      );
    },
  },
  Mutation: {
    async createCompanyPrivacy(_, args, context) {
      return context.controllers.companyPrivacy.create(
        { ...args.input },
        context
      );
    },
    async updateCompanyPrivacy(_, args, context) {
      return context.controllers.companyPrivacy.update(
        { ...args.input },
        context
      );
    },
    async dataShareRequest(_, args, context) {
      return context.controllers.companyPrivacy.dataShareRequest(args, context);
    },
  },
};
