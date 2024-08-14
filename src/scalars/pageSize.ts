import {
  Kind,
  GraphQLError,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql';

export const validateAndSanitise = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new TypeError(`Value is not a whole number: ${value}`);
  }

  if (value < 1) {
    throw new TypeError(`1 is the minimum value for page size`);
  }

  return value;
};

export const GraphQLPageSizeConfig = {
  name: 'PageSize',

  description: 'Validates and sanitises a page size input',

  serialize: validateAndSanitise,

  parseValue: validateAndSanitise,

  parseLiteral(ast) {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Can only validate integers as valid page size values but got a: ${ast.kind}`
      );
    }

    return validateAndSanitise(ast.value);
  },

  extensions: {
    codegenScalarType: 'number',
  },
} as GraphQLScalarTypeConfig<number, number>;

export const GraphQLPageSize = new GraphQLScalarType(GraphQLPageSizeConfig);
