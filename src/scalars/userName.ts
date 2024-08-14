import escape from 'validator/lib/escape';

import {
  Kind,
  GraphQLError,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql';
import { isValidString } from './safeString';

// eslint-disable-next-line no-useless-escape
const FORBIDDEN_NAME_CHARACTERS_REGEX = /[.,\/#!$%\^&\*;:{}=\-_`~()@\\"<>?+|]/g;

const isValidUserName = (name: string) => {
  return !name.match(FORBIDDEN_NAME_CHARACTERS_REGEX);
};

export const validateAndSanitise = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new TypeError(`Value is not a string: ${value}`);
  }

  if (!isValidString(value)) {
    throw new TypeError(`Value contains non-printable characters: ${value}`);
  }
  if (!isValidUserName(value)) {
    throw new TypeError(`Value contains forbidden characters: ${value}`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length < 2) {
    throw new TypeError('Value must contain at least 2 characters');
  }

  if (trimmedValue.length > 26) {
    throw new TypeError('Value must not contain more than 26 characters');
  }

  return escape(trimmedValue);
};

export const GraphQLUserNameConfig = {
  name: 'UserName',

  description: 'Validates and sanitises a user first and last name',

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

export const GraphQLUserName = new GraphQLScalarType(GraphQLUserNameConfig);
