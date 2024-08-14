import { GraphQLSchema } from 'graphql';
import { belongsToApprovedCompanyTransformer } from './transformers/belongsToApprovedCompany';
import { hasRoleTransformer } from './transformers/hasRole';
import { isEnvironmentTransformer } from './transformers/isEnvironment';
import { validateCompanyAccessTransformer } from './transformers/validateCompanyAccess';

type SchemaTransformer = (schema: GraphQLSchema, name: string) => GraphQLSchema;

export const directiveTransformers: [SchemaTransformer, string][] = [
  [hasRoleTransformer, 'hasRole'],
  [isEnvironmentTransformer, 'isEnvironment'],
  [belongsToApprovedCompanyTransformer, 'belongsToApprovedCompany'],
  [validateCompanyAccessTransformer, 'validateCompanyAccess'],
];

/**
 * Accepts a list of [Transformer, Directive Name] tuples and a GraphQLSchema object.
 *
 * Each transformer will map over the schema, applying the transformer
 * function any time the Directive Name matches on a _location_ in the schema.
 *
 * It will do this once for each tuple in the transformer list, continuing to mutate
 * the schema until each _location_ in the schema has had the appropriate transformer applied.
 *
 * More info here:
 * https://www.apollographql.com/docs/apollo-server/schema/creating-directives
 */
export const applyDirectiveTransformers = (
  _directiveTransformers: [SchemaTransformer, string][],
  baseSchema: GraphQLSchema
) => {
  return _directiveTransformers.reduce((schema, [transformer, name]) => {
    return transformer(schema, name);
  }, baseSchema);
};
