import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import {
  User,
  Company,
  CreateCorporateEmissionInput,
  DeleteCorporateEmissionInput,
  UpdateCorporateEmissionInput,
  CorporateEmissionRank,
  CorporateCarbonIntensityComparison,
  File,
  CarbonIntensity,
} from '../types';
import { ResolverFunction } from './types';

type CorporateEmissionsResolverType = {
  Query: {
    corporateEmissions: ResolverFunction<
      { companyId: string; year?: number },
      CorporateEmissionEntity[]
    >;
    corporateEmissionRanks: ResolverFunction<
      { companyId: string; year: number },
      CorporateEmissionRank[]
    >;
    corporateEmissionRank: ResolverFunction<
      { companyId: string; year: number },
      CorporateEmissionRank | undefined
    >;
    baseline: ResolverFunction<
      { companyId: string },
      CorporateEmissionEntity | undefined
    >;
    corporateCarbonIntensityComparisons: ResolverFunction<
      { companyId: string; years: number[] },
      CorporateCarbonIntensityComparison[]
    >;
    latestCorporateEmission: ResolverFunction<
      { companyId: string },
      CorporateEmissionEntity | undefined
    >;
  };
  Mutation: {
    deleteCorporateEmission: ResolverFunction<
      { input: DeleteCorporateEmissionInput },
      string
    >;
    createCorporateEmission: ResolverFunction<
      { input: CreateCorporateEmissionInput },
      CorporateEmissionEntity
    >;
    updateCorporateEmission: ResolverFunction<
      { input: UpdateCorporateEmissionInput },
      CorporateEmissionEntity
    >;
  };
  CorporateEmission: {
    company: ResolverFunction<undefined, Company | undefined>;
    createdByUser: ResolverFunction<undefined, User | undefined>;
    updatedByUser: ResolverFunction<undefined, User | undefined>;
    verificationFile: ResolverFunction<undefined, File | undefined>;
    carbonIntensities: ResolverFunction<undefined, CarbonIntensity[]>;
  };
};

export const emissionResolvers: CorporateEmissionsResolverType = {
  Query: {
    async corporateEmissions(_, args, context) {
      return context.controllers.corporateEmission.findByCompanyId(
        {
          companyId: args.companyId,
          year: args.year,
        },
        context
      );
    },
    async baseline(_, args, context) {
      return context.controllers.corporateEmission.findBaselineByCompanyId(
        {
          companyId: args.companyId,
        },
        context
      );
    },
    async corporateEmissionRanks(_, args, context) {
      return context.controllers.corporateEmission.getCorporateEmissionRanks(
        {
          companyId: args.companyId,
          year: args.year,
        },
        context
      );
    },
    async corporateCarbonIntensityComparisons(_, args, context) {
      return context.controllers.corporateEmission.getCarbonIntensityComparisons(
        {
          companyId: args.companyId,
          years: args.years,
        },
        context
      );
    },
    async corporateEmissionRank(_, args, context) {
      return context.controllers.corporateEmission.getCorporateEmissionRank(
        {
          companyId: args.companyId,
          year: args.year,
        },
        context
      );
    },
    async latestCorporateEmission(_, args, context) {
      return context.controllers.corporateEmission.findLatestByCompanyId(
        {
          companyId: args.companyId,
        },
        context
      );
    },
  },
  Mutation: {
    async deleteCorporateEmission(_, args, context) {
      return context.controllers.corporateEmission.deleteCorporateEmission(
        args.input,
        context
      );
    },
    async createCorporateEmission(_, args, context) {
      return context.controllers.corporateEmission.createCorporateEmission(
        args.input,
        context
      );
    },
    async updateCorporateEmission(_, args, context) {
      return context.controllers.corporateEmission.updateCorporateEmission(
        args.input,
        context
      );
    },
  },
  CorporateEmission: {
    async company({ companyId }, _, { loaders }) {
      return loaders.company.load(companyId);
    },
    async createdByUser({ createdBy }, _, { loaders }) {
      return loaders.user.load(createdBy);
    },
    async updatedByUser({ updatedBy }, _, { loaders }) {
      if (updatedBy) {
        return loaders.user.load(updatedBy);
      }
      return undefined;
    },
    async verificationFile({ verificationFileId }, _, { loaders }) {
      if (verificationFileId) {
        return loaders.file.load(verificationFileId);
      }
      return undefined;
    },
    async carbonIntensities({ id: emissionId }, _, { loaders }) {
      return loaders.carbonIntensities.load(emissionId);
    },
  },
};
