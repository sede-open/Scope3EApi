import { In } from 'typeorm';
import userRoleConfig from '../access/userRoleConfig';
import { getOrCreateConnection } from '../dbConnection';
import { CompanyEntity } from '../entities/Company';
import { RoleEntity } from '../entities/Role';
import { UserEntity } from '../entities/User';
import { AuthProvider, CompanyStatus, RoleName, UserStatus } from '../types';
import { company2Mock, CompanyMock, companyMock } from './company';

type UserEntityMock = Omit<
  UserEntity,
  | 'createdAt'
  | 'updatedAt'
  | 'remove'
  | 'hasId'
  | 'save'
  | 'softRemove'
  | 'recover'
  | 'reload'
>;

export interface UserMock extends UserEntityMock {
  createdAt: string;
  updatedAt: string;
}

type RoleEntityMock = Omit<
  RoleEntity,
  | 'createdAt'
  | 'updatedAt'
  | 'remove'
  | 'hasId'
  | 'save'
  | 'softRemove'
  | 'recover'
  | 'reload'
  | 'name'
>;

export interface RoleMock extends RoleEntityMock {
  createdAt: string;
  updatedAt: string;
  name: RoleName | string;
}

export const adminUserMock = {
  id: 'd483271b-d5ad-490c-b5c4-d5d66b3205fa',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'McTest',
  authProvider: AuthProvider.Port,
  status: UserStatus.Active,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  companyId: companyMock.id,
  isDeleted: false,
};

export const supportUserMock = {
  id: 'd986168b-9b95-4dc3-830c-79037878c35f',
  email: 'testsupport@example.com',
  firstName: 'Support',
  lastName: 'McTest',
  authProvider: AuthProvider.Port,
  status: UserStatus.Active,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const supplierEditorUserMock = {
  id: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  email: 'test@external.com',
  firstName: 'George',
  lastName: 'Moonie',
  authProvider: AuthProvider.Akamai,
  companyId: companyMock.id,
  status: UserStatus.Active,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const supplierViewerUserMock = {
  id: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  email: 'test@external.com',
  firstName: 'George',
  lastName: 'Moonie',
  authProvider: AuthProvider.Akamai,
  companyId: companyMock.id,
  status: UserStatus.Active,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const supplierEditorUser2Mock = {
  id: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  email: 'test@external.com',
  firstName: 'Micky',
  lastName: 'Mouse',
  authProvider: AuthProvider.Akamai,
  companyId: company2Mock.id,
  status: UserStatus.Active,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

interface IGetCurrentUser {
  userOverrides?: Partial<UserMock>;
  companyOverrides?: Partial<CompanyMock>;
  roles?: RoleEntity[];
}

export const getCurrentUser = ({
  userOverrides,
  companyOverrides,
  roles = [],
}: IGetCurrentUser) => ({
  // NOTE :: supplierEditorUserMock is added
  // to the DB on integration test setup
  ...supplierEditorUserMock,
  // NOTE :: id is uppercased as when it's retrieved from DB,
  // typeorm captilises it
  id: supplierEditorUserMock.id.toUpperCase(),
  ...userOverrides,
  company: ({
    id: '63ac35c6-6a25-4867-a936-9873b4100048',
    name: 'Yet Another Inc',
    location: 'DE',
    businessSection: 'IT',
    subSector: 'consulting',
    primarySector: 'Professional service',
    createdAt: '2020-08-27 09:11:00',
    updatedAt: '2020-08-27 09:11:00',
    reviewedAt: '2020-08-27 09:11:00',
    duns: '3311111111',
    dnbRegion: 'Düsseldorf',
    dnbCountry: 'Germany',
    dnbCountryIso: 'DE',
    dnbPostalCode: 'DDD DDDD',
    dnbAddressLineOne: 'G Street',
    dnbAddressLineTwo: 'D Street',
    status: CompanyStatus.Active,
    ...companyOverrides,
  } as unknown) as CompanyEntity,
  roles,
});

export const createUserMock = async (
  overrides: Partial<UserEntity> & { id: string },
  roleName: RoleName
) => {
  const rolesToSave = userRoleConfig[roleName].assumesAccessTo;

  const roles =
    (await (await getOrCreateConnection())
      .createQueryBuilder()
      .select('role')
      .from(RoleEntity, 'role')
      .where({ name: In(Object.values(rolesToSave)) })
      .getMany()) ?? [];

  const { id: legacyRoleId } =
    roles.find((role) => role.name === roleName) ?? {};

  if (!legacyRoleId) {
    throw new Error(`Could not find a role with the name: ${roleName}`);
  }

  switch (roleName) {
    case RoleName.Admin:
      return {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'McTest',
        authProvider: AuthProvider.Port,
        status: UserStatus.Active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        roles,
        ...overrides,
      };
    case RoleName.SupplierEditor:
      /* You must give a companyId override when you create an editor */
      return {
        email: 'test@external.com',
        firstName: 'George',
        lastName: 'Moonie',
        authProvider: AuthProvider.Akamai,
        status: UserStatus.Active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        roles,
        ...overrides,
      };
    case RoleName.SupplierViewer:
      /* You must give a companyId override when you create a viewer */
      return {
        email: 'test@external.com',
        firstName: 'George',
        lastName: 'Moonie',
        authProvider: AuthProvider.Akamai,
        status: UserStatus.Active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        roles,
        ...overrides,
      };
    default:
      throw new Error(
        `Cannot create a user mock as '${roleName}' is not a supported role name`
      );
  }
};
