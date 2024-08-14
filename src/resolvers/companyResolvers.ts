import { CompanyEntity } from '../entities/Company';
import { CompanySectorEntity } from '../entities/CompanySector';
import { UserEntity } from '../entities/User';
import {
  AcceptCompanyInviteInput,
  ApproveCompanyInput,
  CompaniesBenchmarkInput,
  DeclineCompanyInviteInput,
  DnBTypeaheadResult,
  UpdateCompanyStatusInput,
  VetoCompanyInput,
  CompanyProfile,
  CompanyBenchmarkRes,
} from '../types';
import { ResolverFunction } from './types';

type CompanyResolverType = {
  Query: {
    companies: ResolverFunction<
      { offset: number; limit: number },
      { data: CompanyEntity[]; total: number }
    >;
    companyByDuns: ResolverFunction<
      { duns: string },
      CompanyEntity | undefined
    >;
    dnbTypeaheadSearch: ResolverFunction<
      {
        searchTerm: string;
      },
      DnBTypeaheadResult[]
    >;
    companiesBenchmark: ResolverFunction<
      { input: CompaniesBenchmarkInput },
      CompanyBenchmarkRes
    >;
    companyProfile: ResolverFunction<
      { companyId: string },
      CompanyProfile | undefined
    >;
  };
  Mutation: {
    updateCompanyStatus: ResolverFunction<
      { input: UpdateCompanyStatusInput },
      CompanyEntity | undefined
    >;
    acceptCompanyInvite: ResolverFunction<
      { input: AcceptCompanyInviteInput },
      string
    >;
    declineCompanyInvite: ResolverFunction<
      { input: DeclineCompanyInviteInput },
      string
    >;
    vetoCompany: ResolverFunction<{ input: VetoCompanyInput }, CompanyEntity>;
    approveCompany: ResolverFunction<
      { input: ApproveCompanyInput },
      CompanyEntity
    >;
  };
  Company: {
    createdByUser: ResolverFunction<undefined, UserEntity | undefined>;
    updatedByUser: ResolverFunction<undefined, UserEntity | undefined>;
    reviewedByUser: ResolverFunction<undefined, UserEntity | undefined>;
    users: ResolverFunction<undefined, UserEntity[]>;
    companySectors: ResolverFunction<undefined, CompanySectorEntity[]>;
  };
};

export const companyResolvers: CompanyResolverType = {
  Query: {
    async companies(_, args, context) {
      return context.controllers.company.findAndCount(args, context);
    },
    async companyByDuns(_, args, context) {
      return context.controllers.company.findByDuns(args, context);
    },
    async dnbTypeaheadSearch(_, args, context) {
      return context.controllers.company.searchForDnBCompanies(args, context);
    },
    async companiesBenchmark(_, args, context) {
      return context.controllers.company.companiesBenchmark(
        args.input,
        context
      );
    },
    async companyProfile(_, { companyId }, context) {
      return context.controllers.company.companyProfile({ companyId }, context);
    },
  },
  Mutation: {
    async updateCompanyStatus(_, args, context) {
      return context.controllers.company.updateCompanyStatus(
        { ...args.input },
        context
      );
    },
    async acceptCompanyInvite(_, args, context) {
      return context.controllers.company.acceptInvite(
        { ...args.input },
        context
      );
    },
    async declineCompanyInvite(_, args, context) {
      return context.controllers.company.declineInviteTransaction(
        { ...args.input },
        context
      );
    },
    async vetoCompany(_, args, context) {
      return context.controllers.company.vetoCompanyTransaction(
        { ...args.input },
        context
      );
    },
    async approveCompany(_, args, context) {
      return context.controllers.company.approveCompanyTransaction(
        { ...args.input },
        context
      );
    },
  },
  Company: {
    async users({ id }, _, { loaders }) {
      return loaders.companyUsers.load(id);
    },
    async createdByUser({ createdBy }, _, { loaders }) {
      if (createdBy) {
        return loaders.user.load(createdBy);
      }
    },
    async updatedByUser({ updatedBy }, _, { loaders }) {
      if (updatedBy) {
        return loaders.user.load(updatedBy);
      }
      return undefined;
    },
    async reviewedByUser({ reviewedBy }, _, { loaders }) {
      if (reviewedBy) {
        return loaders.user.load(reviewedBy);
      }
      return undefined;
    },
    async companySectors({ id }, _, { loaders }) {
      return loaders.companySectors.load(id);
    },
  },
};
