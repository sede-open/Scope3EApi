import { ApolloError } from 'apollo-server-express';
import { RoleName } from '../types';

export const adminsMustUseExampleEmailError = () =>
  new ApolloError(
    `In order to grant the ${RoleName.Admin} role, users must have an @example.com email address`
  );

export const userCannotGrantRoleError = (role: string) =>
  new ApolloError(`User does not have permission to grant ${role}`);

export const userCannotChangeUsersRoleError = (
  userRole: string,
  targetUserRole: string
) =>
  new ApolloError(
    `${
      userRole.startsWith('A') ? 'An' : 'A'
    } ${userRole} does not have permission to change ${targetUserRole}'s role`
  );
