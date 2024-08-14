import { RoleName } from '../types';
import { adminsMustUseExampleEmailError } from './exceptions';
import {
  assertCurrentUserCanGrantRole,
  assertUserCanBeIssuedRole,
} from './utils';

describe('assertCurrentUserCanGrantRole', () => {
  it('should raise an error if an editor attempts to grant an admin role', () => {
    expect(() =>
      assertCurrentUserCanGrantRole({
        currentUserRoles: [RoleName.SupplierEditor, RoleName.SupplierViewer],
        targetUserRoles: null,
        userIsGranting: RoleName.Admin,
      })
    ).toThrow('User does not have permission to grant XYZ Administrator');
  });

  it('should raise an error if an account manager attempts to grant an admin role', () => {
    expect(() =>
      assertCurrentUserCanGrantRole({
        currentUserRoles: [RoleName.AccountManager, RoleName.SupplierViewer],
        targetUserRoles: null,
        userIsGranting: RoleName.Admin,
      })
    ).toThrow('User does not have permission to grant XYZ Administrator');
  });

  it('should raise an error if a viewer attempts to grant an admin role', () => {
    expect(() =>
      assertCurrentUserCanGrantRole({
        currentUserRoles: [RoleName.SupplierViewer],
        targetUserRoles: null,
        userIsGranting: RoleName.Admin,
      })
    ).toThrow('User does not have permission to grant XYZ Administrator');
  });

  it('should return undefined if an editor grants a viewer role', () => {
    expect(
      assertCurrentUserCanGrantRole({
        currentUserRoles: [RoleName.SupplierEditor, RoleName.SupplierViewer],
        targetUserRoles: null,
        userIsGranting: RoleName.SupplierViewer,
      })
    ).toBeUndefined();
  });

  it('should return undefined if an editor grants an editor role', () => {
    expect(
      assertCurrentUserCanGrantRole({
        currentUserRoles: [RoleName.SupplierEditor, RoleName.SupplierViewer],
        targetUserRoles: null,
        userIsGranting: RoleName.SupplierEditor,
      })
    ).toBeUndefined();
  });

  it('should return undefined if an editor promotes a viewer to editor', () => {
    expect(
      assertCurrentUserCanGrantRole({
        currentUserRoles: [RoleName.SupplierEditor, RoleName.SupplierViewer],
        targetUserRoles: [RoleName.SupplierViewer],
        userIsGranting: RoleName.SupplierEditor,
      })
    ).toBeUndefined();
  });

  it('should return undefined if an editor promotes a viewer to account manager', () => {
    expect(
      assertCurrentUserCanGrantRole({
        currentUserRoles: [RoleName.SupplierEditor, RoleName.SupplierViewer],
        targetUserRoles: [RoleName.SupplierViewer],
        userIsGranting: RoleName.AccountManager,
      })
    ).toBeUndefined();
  });
});

describe('assertUserCanBeIssuedRole', () => {
  it('should throw an error when attempting to grant a non example.com user an admin role', () => {
    expect(() =>
      assertUserCanBeIssuedRole({
        email: 'notfromexample@gmail.com',
        userIsBeingGranted: RoleName.Admin,
        exception: adminsMustUseExampleEmailError(),
      })
    ).toThrow(
      `In order to grant the ${RoleName.Admin} role, users must have an @example.com email address`
    );
  });

  it('should return undefined when the user is granting an admin role to a example.com email address', () => {
    expect(
      assertUserCanBeIssuedRole({
        email: 'matt@example.com',
        userIsBeingGranted: RoleName.Admin,
        exception: adminsMustUseExampleEmailError(),
      })
    ).toBeUndefined();
  });
});
