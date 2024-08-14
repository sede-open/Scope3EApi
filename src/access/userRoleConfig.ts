import { RoleName } from '../types';

interface RolePermission {
  canGrant: RoleName[];
  assumesAccessTo: RoleName[];
  restrictsAccessTo: RoleName[];
}

type UserRoleConfig = {
  [key in RoleName]: RolePermission;
};

const userRoleConfig: UserRoleConfig = {
  [RoleName.Admin]: {
    canGrant: [
      RoleName.Admin,
      RoleName.SupplierEditor,
      RoleName.AccountManager,
      RoleName.SupplierViewer,
    ],
    assumesAccessTo: [
      RoleName.Admin,
      RoleName.SupplierEditor,
      RoleName.SupplierViewer,
    ],
    restrictsAccessTo: [],
  },
  [RoleName.SupplierEditor]: {
    canGrant: [
      RoleName.SupplierEditor,
      RoleName.AccountManager,
      RoleName.SupplierViewer,
    ],
    assumesAccessTo: [RoleName.SupplierEditor, RoleName.SupplierViewer],
    restrictsAccessTo: [RoleName.Admin],
  },
  [RoleName.AccountManager]: {
    canGrant: [RoleName.SupplierViewer, RoleName.AccountManager],
    assumesAccessTo: [RoleName.AccountManager, RoleName.SupplierViewer],
    restrictsAccessTo: [RoleName.SupplierEditor, RoleName.Admin],
  },
  [RoleName.SupplierViewer]: {
    canGrant: [],
    assumesAccessTo: [RoleName.SupplierViewer],
    restrictsAccessTo: [
      RoleName.SupplierEditor,
      RoleName.AccountManager,
      RoleName.Admin,
    ],
  },
};

export default userRoleConfig;
