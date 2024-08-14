import { v4 as uuidV4 } from 'uuid';
import { getOrCreateConnection } from '../dbConnection';
import { RoleRepository } from '../repositories/RoleRepository';
import { RoleName } from '../types';
import { authenticateUser } from '../auth';
import { getCurrentUser } from '../mocks/user';
import { getApolloServer } from '../apollo';
import { GraphQLError } from 'graphql';

jest.mock('../auth');

describe('CompanyRelationshipRecommendationResolvers', () => {
  describe('companyRelationshipRecommendations', () => {
    const myCompanyId = uuidV4().toUpperCase();
    const notMyCompanyId = uuidV4().toUpperCase();

    it('should throw an error if you try and access company data that is not from your company', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          userOverrides: {
            companyId: myCompanyId,
          },
          companyOverrides: {
            id: myCompanyId,
          },
          roles,
        }),
      }));

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: `
          query CompanyRelationshipRecommendationsQuery(
            $companyId: UUID!
            $relationshipTypes: [CompanyRelationshipType!]!
            $recommendationStatuses: [CompanyRelationshipRecommendationStatus!]!
          ) {
            companyRelationshipRecommendations(
              companyId: $companyId
              relationshipTypes: $relationshipTypes
              recommendationStatuses: $recommendationStatuses
            ) {
              id
              duns
              relationshipType
              recommendationStatus
              name
              companyId
            }
          }
        `,
        variables: {
          companyId: notMyCompanyId,
          relationshipTypes: [],
          recommendationStatuses: [],
        },
      });

      expect(result.data).toBeNull();
      expect(result.errors).toEqual([
        new GraphQLError(
          'Access Error when validating input parameters. "companyId" does not belong to the user\'s company.'
        ),
      ]);
    });
  });
});
