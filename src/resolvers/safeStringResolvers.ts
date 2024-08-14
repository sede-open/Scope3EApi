import { GraphQLScalarType } from 'graphql';
import { GraphQLSafeString } from '../scalars/safeString';

type SafeStringResolverType = {
  SafeString: GraphQLScalarType;
};

export const safeStringResolvers: SafeStringResolverType = {
  SafeString: GraphQLSafeString,
};
