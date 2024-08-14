import { GraphQLScalarType } from 'graphql';
import { GraphQLPageSize } from '../scalars/pageSize';

type PageSizeResolverType = {
  PageSize: GraphQLScalarType;
};

export const pageSizeResolvers: PageSizeResolverType = {
  PageSize: GraphQLPageSize,
};
