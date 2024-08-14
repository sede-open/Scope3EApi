import { RoleEntity } from '../entities/Role';
import { RoleName } from '../types';

export const adminRoleMock = {
  id: 'd483271b-d5ad-490c-67c4-d5d66b3205fa',
  name: 'ADMIN',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const supplierEditorRoleMock = {
  id: 'd483271b-d5ad-490c-67c4-d5d66b3205bn',
  name: 'SUPPLIER_EDITOR',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const supplierViewerRoleMock = {
  id: 'gh83271b-d5ad-490c-67c4-d5d66b3205bn',
  name: 'SUPPLIER_VIEWER',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const createRoleMock = (
  overrides: Partial<RoleEntity & { id: string; name: RoleName }>
) => ({
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  ...overrides,
});
