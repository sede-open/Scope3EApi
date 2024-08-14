import { GraphQLSchema } from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';
import { ForbiddenError } from 'apollo-server-express';
import { Role } from '../../types';

export const NO_ACCESS_TO_FIELD_ERROR =
  'You do not have the correct role to access this field';

export const hasRoleTransformer = (
  schema: GraphQLSchema,
  directiveName: string
) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const hasRoleDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];

      if (!hasRoleDirective) {
        return fieldConfig;
      }

      const { resolve = defaultFieldResolver } = fieldConfig;

      const admittableRoles = hasRoleDirective['roles'];

      fieldConfig.resolve = async function (source, args, context, info) {
        let userHasAppropriateRole = false;

        context.user.roles
          .map((role: Role) => role.name)
          .forEach((role: Role) => {
            if (admittableRoles.includes(role)) {
              userHasAppropriateRole = true;
            }
          });

        if (!userHasAppropriateRole) {
          throw new ForbiddenError(NO_ACCESS_TO_FIELD_ERROR);
        }

        return resolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
};
