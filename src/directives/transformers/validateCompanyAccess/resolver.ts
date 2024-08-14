import { ApolloError } from 'apollo-server-express';
import { GraphQLFieldResolver } from 'graphql';
import { IContext } from '../../../apolloContext';
import {
  ValidateCompanyAccessDirectiveArgs,
  Role,
  RoleName,
} from '../../../types';

export const getCompanyAccessResolver = (
  originalResolver: GraphQLFieldResolver<undefined, IContext>,
  { permitAdmins, inputFieldsToValidate }: ValidateCompanyAccessDirectiveArgs
) => {
  const resolve: GraphQLFieldResolver<undefined, IContext> = async function (
    source,
    args,
    context,
    info
  ) {
    const userRoles = context.user.roles?.map((role: Role) => role.name) ?? [];

    if (userRoles.includes(RoleName.Admin) && permitAdmins) {
      return originalResolver(source, args, context, info);
    }

    inputFieldsToValidate.forEach((inputKey) => {
      if (args[inputKey] !== context.user.companyId) {
        throw new ApolloError(
          `Access Error when validating input parameters. "${inputKey}" does not belong to the user's company.`
        );
      }
    });

    return originalResolver(source, args, context, info);
  };

  return resolve;
};
