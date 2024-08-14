import jwt from 'jsonwebtoken';
import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { getCurrentUser } from '../mocks/user';
import { JWT_MATCH_REGEXP } from '../constants/jwt';
import { getSecondsInNumberOfDays } from '../utils/datetime';
import { getConfig } from '../config';
import { getOrCreateConnection } from '../dbConnection';
import { RoleRepository } from '../repositories/RoleRepository';
import { CompanyStatus, RoleName } from '../types';

jest.mock('../auth');

describe('tribeResolvers', () => {
  describe('tribeUsageStats', () => {
    it.each`
      role
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
      ${RoleName.Admin}
    `('should give correct count of user stats', async ({ role }) => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(role);
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          companyOverrides: {
            status: CompanyStatus.Active,
          },
          roles,
        }),
      }));
      const server = getApolloServer();

      const result = await server.executeOperation({
        query: `
          query {
            tribeUsageStats {
              replies
              members
              topics
            }
          }
        `,
      });

      expect(result.data?.tribeUsageStats).toEqual(
        expect.objectContaining({ replies: 400, members: 69809, topics: 500 })
      );
    });
  });

  describe.each`
    role
    ${RoleName.SupplierEditor}
    ${RoleName.SupplierViewer}
    ${RoleName.Admin}
  `('tribeJwt', ({ role }) => {
    const userId = '';
    const email = 'matthew.bridges@example.com';
    const firstName = 'Matt';
    const lastName = 'Bridges';
    const nowUnix = 1655721071;
    const nowSeconds = Math.round(nowUnix / 1000);

    beforeAll(async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(role);
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          userOverrides: {
            id: userId,
            email,
            firstName,
            lastName,
          },
          roles,
        }),
      }));
      jest.useFakeTimers().setSystemTime(nowUnix);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should generate a token for the signed in user', async () => {
      const {
        jwt: { xyzIssuer },
      } = getConfig();

      const server = getApolloServer();

      const { data, errors } = await server.executeOperation({
        query: `
          query {
            tribeJwt {
              token
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data?.tribeJwt.token).toMatch(JWT_MATCH_REGEXP);

      const payload = jwt.decode(data?.tribeJwt.token);
      expect(payload).toEqual({
        email,
        exp: nowSeconds + getSecondsInNumberOfDays(14),
        iat: nowSeconds,
        iss: xyzIssuer,
        name: `${firstName} ${lastName}`,
        sub: email,
      });
    });
  });
});
