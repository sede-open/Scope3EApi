import { makeExecutableSchema } from '@graphql-tools/schema';
import { gql } from 'apollo-server-express';
import { validateCompanyAccessTransformer } from '.';

describe('validateCompanyAccessTransformer', () => {
  const getTestSchema = (queryString: string) => `
    schema {
      query: Query
    }
    
    directive @validateCompanyAccess(inputFieldsToValidate: [String!]!, permitAdmins: Boolean!) on FIELD_DEFINITION

    type Query {
      ${queryString}
    }
  `;

  it('should throw an error when the directive is not configured correctly', () => {
    const graphqlSchema = makeExecutableSchema({
      typeDefs: gql(
        getTestSchema(
          'privateCompanyData(companyId: String!, privateField: String!): [String!]! @validateCompanyAccess(inputFieldsToValidate: ["anIncorrectInput", "anotherIncorrectInput"], permitAdmins: true)'
        )
      ),
      resolvers: [],
    });

    try {
      validateCompanyAccessTransformer(graphqlSchema, 'validateCompanyAccess');
    } catch (error) {
      expect(error.message).toEqual(
        'Error when validating input parameters. Missing input. [anIncorrectInput, anotherIncorrectInput] could not be found in [companyId, privateField]. This means you have likely misconfigured your GraphQL Schema.'
      );
    }

    expect.assertions(1);
  });
});
