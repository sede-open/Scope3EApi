import { ApolloError } from 'apollo-server-express';
import { IContext } from '../apolloContext';
import { USER_COMPANY_ERROR } from '../errors/commonErrorMessages';
import { RoleName } from '../types';
import {
  userCannotChangeUsersRoleError,
  userCannotGrantRoleError,
} from './exceptions';
import userRoleConfig from './userRoleConfig';

interface IAssertUserCanGrantRole {
  currentUserRoles: RoleName[];
  targetUserRoles: RoleName[] | null;
  userIsGranting: RoleName;
}

const roleNameToDisplayName = (roleName: RoleName) => {
  switch (roleName) {
    case RoleName.Admin:
      return 'XYZ Administrator';
    case RoleName.SupplierEditor:
      return 'Company Administrator';
    case RoleName.AccountManager:
      return 'Account Manager';
    case RoleName.SupplierViewer:
      return 'Viewer';
    default:
      return '';
  }
};

export const getRoleTypeFromRoles = (roles: RoleName[]) => {
  const hasAdminRole = roles.includes(RoleName.Admin);
  const hasEditorRole = roles.includes(RoleName.SupplierEditor);
  const hasAccountManagerRole = roles.includes(RoleName.AccountManager);
  const hasViewerRole = roles.includes(RoleName.SupplierViewer);

  if (hasAdminRole && hasEditorRole && hasViewerRole) {
    return RoleName.Admin;
  }

  if (hasEditorRole && hasViewerRole) {
    return RoleName.SupplierEditor;
  }

  if (hasAccountManagerRole && hasViewerRole) {
    return RoleName.AccountManager;
  }

  if (hasViewerRole) {
    return RoleName.SupplierViewer;
  }

  throw new Error("Could not determine user's role");
};

export const assertCurrentUserCanGrantRole = ({
  currentUserRoles,
  targetUserRoles,
  userIsGranting,
}: IAssertUserCanGrantRole): void => {
  const rolesCurrentUserCanGrant = new Set();

  const currentUserRoleType = getRoleTypeFromRoles(currentUserRoles);
  const targetUserRoleType = targetUserRoles
    ? getRoleTypeFromRoles(targetUserRoles)
    : null;

  const rolesUserCannotChange =
    userRoleConfig[currentUserRoleType].restrictsAccessTo;

  currentUserRoles.forEach((roleName) => {
    userRoleConfig[roleName].canGrant.forEach((roleNameToGrant) => {
      rolesCurrentUserCanGrant.add(roleNameToGrant);
    });
  });

  if (!rolesCurrentUserCanGrant.has(userIsGranting)) {
    throw userCannotGrantRoleError(roleNameToDisplayName(userIsGranting));
  }

  if (
    targetUserRoleType &&
    rolesUserCannotChange.includes(targetUserRoleType)
  ) {
    throw userCannotChangeUsersRoleError(
      roleNameToDisplayName(currentUserRoleType),
      roleNameToDisplayName(targetUserRoleType)
    );
  }

  return;
};

interface IAssertUserCanBeIssuedRole<T extends Error> {
  email: string;
  userIsBeingGranted: RoleName;
  exception: T;
}

export const assertUserCanBeIssuedRole = <T extends Error>({
  email,
  userIsBeingGranted,
  exception,
}: IAssertUserCanBeIssuedRole<T>): void => {
  if (userIsBeingGranted === RoleName.Admin && !email.endsWith('@example.com')) {
    throw exception;
  }
};

export const assertSessionUserBelongsToCompany = (
  companyId: string,
  context: IContext
) => {
  if (companyId !== context.user.companyId) {
    throw new ApolloError(USER_COMPANY_ERROR);
  }
};
