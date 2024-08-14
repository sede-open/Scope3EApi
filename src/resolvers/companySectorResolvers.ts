import { CompanySectorEntity } from '../entities/CompanySector';
import {
  User,
  Company,
  Sector,
  UpdateCompanySectorsInput,
  CompanySector,
} from '../types';

import { ResolverFunction } from './types';

type CompanySectorResolverType = {
  Query: {
    companySectors: ResolverFunction<
      {
        companyId: string;
      },
      CompanySector[]
    >;
  };
  Mutation: {
    updateCompanySectors: ResolverFunction<
      { input: UpdateCompanySectorsInput },
      CompanySectorEntity[]
    >;
  };
  CompanySector: {
    company: ResolverFunction<undefined, Company | undefined>;
    sector: ResolverFunction<undefined, Sector | undefined>;
    createdByUser: ResolverFunction<undefined, User>;
    updatedByUser: ResolverFunction<undefined, User | undefined>;
  };
};

export const companySectorResolvers: CompanySectorResolverType = {
  Query: {
    async companySectors(_, args, context) {
      return context.controllers.companySector.findByCompanyId(args, context);
    },
  },
  Mutation: {
    async updateCompanySectors(_, args, context) {
      return context.controllers.companySector.updateCompanySectors(
        args.input,
        context
      );
    },
  },
  CompanySector: {
    async company({ companyId }, _, { loaders }) {
      return loaders.company.load(companyId);
    },
    async sector({ sectorId }, _, { loaders }) {
      return loaders.sector.load(sectorId);
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
  },
};
