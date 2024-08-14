import {
  EmissionAllocation,
  Company,
  User,
  EmissionAllocationDirection,
  EmissionAllocationStatus,
  Category,
  CreateEmissionAllocationInput,
  UpdateEmissionAllocationInput,
  DeleteEmissionAllocationInput,
} from '../types';
import { ResolverFunction } from './types';

type EmissionAllocationResolverType = {
  Query: {
    emissionAllocations: ResolverFunction<
      {
        companyId: string;
        emissionAllocation?: EmissionAllocationDirection;
        statuses?: EmissionAllocationStatus[];
      },
      EmissionAllocation[]
    >;
    emissionsAllocatedToMyCompany: ResolverFunction<
      { supplierId: string },
      EmissionAllocation[]
    >;
  };
  Mutation: {
    createEmissionAllocation: ResolverFunction<
      { input: CreateEmissionAllocationInput },
      EmissionAllocation
    >;
    updateEmissionAllocation: ResolverFunction<
      { input: UpdateEmissionAllocationInput },
      EmissionAllocation
    >;
    deleteEmissionAllocation: ResolverFunction<
      { input: DeleteEmissionAllocationInput },
      string
    >;
  };
  EmissionAllocation: {
    supplier: ResolverFunction<undefined, Company | undefined>;
    customer: ResolverFunction<undefined, Company>;
    supplierApprover: ResolverFunction<undefined, User | undefined>;
    customerApprover: ResolverFunction<undefined, User | undefined>;
    category: ResolverFunction<undefined, Category | undefined>;
  };
};

export const emissionAllocationResolvers: EmissionAllocationResolverType = {
  Query: {
    async emissionAllocations(_, args, context) {
      return context.controllers.emissionAllocation.findByCompanyId(
        args,
        context
      );
    },
    emissionsAllocatedToMyCompany(_, args, context) {
      return context.controllers.emissionAllocation.emissionsAllocatedToMyCompany(
        args,
        context
      );
    },
  },
  Mutation: {
    async createEmissionAllocation(_, args, context) {
      return context.controllers.emissionAllocation.create(args.input, context);
    },
    async updateEmissionAllocation(_, args, context) {
      return context.controllers.emissionAllocation.update(args.input, context);
    },
    async deleteEmissionAllocation(_, args, context) {
      return context.controllers.emissionAllocation.delete(args.input, context);
    },
  },
  EmissionAllocation: {
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
    async category({ categoryId }, _, { loaders }) {
      if (categoryId) {
        return loaders.category.load(categoryId);
      }
      return undefined;
    },
  },
};
