import {
  AmbitionPrivacyStatus,
  Company,
  CompanyRelationship,
  CompanyRelationshipType,
  CreateCompanyRelationshipInput,
  EmissionPrivacyStatus,
  InviteAndConnectToCompanyInput,
  InviteStatus,
  NetworkSummary,
  UpdateCompanyRelationshipInput,
  User,
} from '../types';
import { ResolverFunction } from './types';

type CompanyRelationshipFields = {
  supplier: ResolverFunction<undefined, Company | undefined>;
  customer: ResolverFunction<undefined, Company | undefined>;
  supplierApprover: ResolverFunction<undefined, User | undefined>;
  customerApprover: ResolverFunction<undefined, User | undefined>;
  ambitionPrivacyStatus: ResolverFunction<
    undefined,
    AmbitionPrivacyStatus | null
  >;
  emissionPrivacyStatus: ResolverFunction<
    undefined,
    EmissionPrivacyStatus | null
  >;
};

type CompanyRelationshipResolverType = {
  Query: {
    companyRelationships: ResolverFunction<
      {
        companyId: string;
        relationshipType?: CompanyRelationshipType;
        status?: InviteStatus;
      },
      CompanyRelationship[]
    >;
    networkSummary: ResolverFunction<undefined, NetworkSummary>;
  };
  Mutation: {
    createCompanyRelationship: ResolverFunction<
      { input: CreateCompanyRelationshipInput },
      CompanyRelationship
    >;
    updateCompanyRelationship: ResolverFunction<
      { input: UpdateCompanyRelationshipInput },
      CompanyRelationship
    >;
    inviteAndConnectToCompany: ResolverFunction<
      { input: InviteAndConnectToCompanyInput },
      CompanyRelationship
    >;
  };
  CompanyRelationship: CompanyRelationshipFields;
};

export const companyRelationshipResolvers: CompanyRelationshipResolverType = {
  Query: {
    async companyRelationships(_, args, context) {
      const relationships = await context.controllers.companyRelationship.findByCompanyId(
        args,
        context
      );
      return relationships.map((r) => ({
        ...r,
        ambitions: null,
        emissions: null,
      }));
    },
    async networkSummary(_, args, context) {
      return context.controllers.companyRelationship.networkSummary(
        {},
        context
      );
    },
  },
  Mutation: {
    async createCompanyRelationship(_, args, context) {
      return context.controllers.companyRelationship.create(
        args.input,
        context
      );
    },
    async updateCompanyRelationship(_, args, context) {
      return context.controllers.companyRelationship.update(
        args.input,
        context
      );
    },
    async inviteAndConnectToCompany(_, args, context) {
      return context.controllers.companyRelationship.inviteNewCompany(
        args.input,
        context
      );
    },
  },
  CompanyRelationship: {
    async supplier({ supplierId }, _, { loaders }) {
      return loaders.company.load(supplierId);
    },
    async customer({ customerId }, _, { loaders }) {
      return loaders.company.load(customerId);
    },
    async supplierApprover({ supplierApproverId }, _, { loaders }) {
      if (supplierApproverId) {
        return loaders.user.load(supplierApproverId);
      }
      return undefined;
    },
    async customerApprover({ customerApproverId }, _, { loaders }) {
      if (customerApproverId) {
        return loaders.user.load(customerApproverId);
      }
      return undefined;
    },
    async ambitionPrivacyStatus(data, _, { loaders }) {
      if (data.status !== InviteStatus.Approved) {
        return null;
      }
      if (data.inviteType === CompanyRelationshipType.Supplier) {
        return loaders.ambitionPrivacyStatus.load(data.supplierId);
      }
      return loaders.ambitionPrivacyStatus.load(data.customerId);
    },
    async emissionPrivacyStatus(data, _, { loaders }) {
      if (data.status !== InviteStatus.Approved) {
        return null;
      }
      if (data.inviteType === CompanyRelationshipType.Supplier) {
        return loaders.emissionPrivacyStatus.load(data.supplierId);
      }
      return loaders.emissionPrivacyStatus.load(data.customerId);
    },
  },
};
