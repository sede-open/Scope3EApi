import { GraphQLScalarType } from 'graphql';
import { GraphQLUUID } from 'graphql-scalars';

type GraphQLScalarResolverType = {
  UUID: GraphQLScalarType;
};

export const graphqlScalarsResolvers: GraphQLScalarResolverType = {
  UUID: GraphQLUUID,
};
