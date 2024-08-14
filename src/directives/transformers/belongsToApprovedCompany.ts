import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { ForbiddenError } from 'apollo-server-express';
import {
  hasExternalRole,
  belongsToApprovedCompany,
} from '../../utils/permissions';

export const NO_ACCESS_TO_FIELD_ERROR =
  'You are unable to access the application';

export const belongsToApprovedCompanyTransformer = (
  schema: GraphQLSchema,
  directiveName: string
) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const belongsToApprovedCompanyDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];

      if (!belongsToApprovedCompanyDirective) {
        return fieldConfig;
      }

      const { resolve = defaultFieldResolver } = fieldConfig;

      fieldConfig.resolve = async function (source, args, context, info) {
        const { user } = context;

        if (hasExternalRole(user) && !belongsToApprovedCompany(user)) {
          throw new ForbiddenError(NO_ACCESS_TO_FIELD_ERROR);
        }

        return resolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
};
