import { getApolloServer } from '../apollo';

import { authenticateUser } from '../auth';
import { getOrCreateConnection } from '../dbConnection';
import { getCurrentUser } from '../mocks/user';
import { RoleName } from '../types';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { RoleEntity } from '../entities/Role';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('../auth');

describe('roleResolvers', () => {
  describe('roles', () => {
    const rolesQuery = `
      query {
        roles {
          id
          name
        }
      }
    `;

    describe.each`
      role
      ${RoleName.Admin}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return a list of roles', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);

        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
          }),
        }));

        const dbRoles = await connection.getRepository(RoleEntity).find();

        const server = getApolloServer();
        const result = await server.executeOperation({
          query: rolesQuery,
        });

        expect(result.data?.roles).toHaveLength(dbRoles.length);
      });
    });

    describe.each`
      role
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should throw an error when requesting roles', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);

        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
          }),
        }));

        const server = getApolloServer();
        const result = await server.executeOperation({
          query: rolesQuery,
        });

        expect(result.data?.roles).toBeUndefined();

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: NO_ACCESS_TO_FIELD_ERROR,
            }),
          ])
        );
      });
    });
  });
});
