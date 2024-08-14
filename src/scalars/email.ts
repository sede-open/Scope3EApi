import escape from 'validator/lib/escape';
import isEmail from 'validator/lib/isEmail';

import {
  Kind,
  GraphQLError,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql';

export const validateAndSanitise = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not a string: ${value}`);
  }

  if (!isEmail(value)) {
    throw new TypeError(`Value is not a valid email address: ${value}`);
  }

  return escape(value);
};

export const GraphQLEmailConfig = {
  name: 'Email',

  description: 'Validates and sanitises an email address',

  serialize: validateAndSanitise,

  parseValue: validateAndSanitise,

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(
        `Can only validate strings as a safe string but got a: ${ast.kind}`
      );
    }

    return validateAndSanitise(ast.value);
  },

  extensions: {
    codegenScalarType: 'string',
  },
} as GraphQLScalarTypeConfig<string, string>;

export const GraphQLEmail = new GraphQLScalarType(GraphQLEmailConfig);
