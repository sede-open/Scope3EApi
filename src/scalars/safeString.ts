import escape from 'validator/lib/escape';

import {
  Kind,
  GraphQLError,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql';
import { doesNotContainHTML } from '../utils/validators';

const VALID_STRING_REGEX = /^[ -~]+$/g;

export const isValidString = (value: string) => {
  return value.match(VALID_STRING_REGEX);
};

export const validateAndSanitise = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not a string: ${value}`);
  }

  if (value.length && (!isValidString(value) || !doesNotContainHTML(value))) {
    throw new TypeError(
      `Value contains non-printable or forbidden characters: ${value}`
    );
  }

  return escape(value);
};

export const GraphQLSafeStringConfig = {
  name: 'SafeString',

  description:
    'Any <, >, &, \', " and / will be replaced with HTML entities within the string',

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

export const GraphQLSafeString = new GraphQLScalarType(GraphQLSafeStringConfig);
