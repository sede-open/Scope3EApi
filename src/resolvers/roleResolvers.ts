import { OrderBy, Role, RoleName } from '../types';
import { ResolverFunction } from './types';

type RoleResolverType = {
  Query: {
    roles: ResolverFunction<{ orderBy: OrderBy }, Role[]>;
    companyUserRoles: ResolverFunction<Record<string, unknown>, Role[]>;
  };
};

export const roleResolvers: RoleResolverType = {
  Query: {
    async roles(_, args, context) {
      return context.controllers.role.findAll({ ...args }, context);
    },
    async companyUserRoles(_, args, context) {
      return context.controllers.role.findByNames(
        {
          names: [RoleName.SupplierEditor, RoleName.SupplierViewer],
        },
        context
      );
    },
  },
};
