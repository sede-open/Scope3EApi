import { GraphQLScalarType } from 'graphql';
import { GraphQLEmail } from '../scalars/email';

type EmailResolverType = {
  Email: GraphQLScalarType;
};

export const emailResolvers: EmailResolverType = {
  Email: GraphQLEmail,
};
