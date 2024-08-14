import { GraphQLScalarType } from 'graphql';
import { GraphQLUserName } from '../scalars/userName';

type UserNameResolverType = {
  UserName: GraphQLScalarType;
};

export const userNameResolvers: UserNameResolverType = {
  UserName: GraphQLUserName,
};
