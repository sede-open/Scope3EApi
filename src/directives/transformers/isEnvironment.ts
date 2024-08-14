import { GraphQLSchema, defaultFieldResolver } from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { ForbiddenError } from 'apollo-server-express';
import { Environment, getConfig } from '../../config';

export const NO_ACCESS_TO_FIELD_ERROR = 'This field is not available.';

export const isEnvironmentTransformer = (
  schema: GraphQLSchema,
  directiveName: string
) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const isEnvironmentDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];

      if (!isEnvironmentDirective) {
        return fieldConfig;
      }

      const { resolve = defaultFieldResolver } = fieldConfig;
      const allowedEnvironments = isEnvironmentDirective[
        'environments'
      ] as Environment[];

      fieldConfig.resolve = async function (source, args, context, info) {
        const { environment: currentEnvironment } = getConfig();

        if (!allowedEnvironments.includes(currentEnvironment)) {
          throw new ForbiddenError(NO_ACCESS_TO_FIELD_ERROR);
        }

        return resolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
};
