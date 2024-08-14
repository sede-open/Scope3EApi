import {
  GraphQLSchema,
  defaultFieldResolver,
  GraphQLFieldConfig,
} from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { ValidateCompanyAccessDirectiveArgs } from '../../../types';
import { IContext } from '../../../apolloContext';
import { assertInputFieldsMatchObjectFieldArgs } from './utils';
import { getCompanyAccessResolver } from './resolver';

export const validateCompanyAccessTransformer = (
  schema: GraphQLSchema,
  directiveName: string
) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (
      fieldConfig: GraphQLFieldConfig<undefined, IContext>
    ) => {
      const { resolve = defaultFieldResolver } = fieldConfig;
      const [directiveParams] = (getDirective(
        schema,
        fieldConfig,
        directiveName
      ) ?? []) as ValidateCompanyAccessDirectiveArgs[];

      if (!directiveParams) {
        return fieldConfig;
      }

      if (typeof fieldConfig.args === 'object') {
        assertInputFieldsMatchObjectFieldArgs(
          directiveParams.inputFieldsToValidate,
          Object.keys(fieldConfig.args ?? {})
        );
      }

      fieldConfig.resolve = getCompanyAccessResolver(resolve, directiveParams);

      return fieldConfig;
    },
  });
};
