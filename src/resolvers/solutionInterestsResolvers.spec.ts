import { getApolloServer } from '../apollo';

import { authenticateUser } from '../auth';
import { CompanyStatus, RoleName } from '../types';
import { getOrCreateConnection } from '../dbConnection';
import { SolutionInterestsEntity } from '../entities/SolutionInterests';
import { getCurrentUser } from '../mocks/user';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('../auth');

describe('solutionInterestsResolvers', () => {
  describe('solutionInterests', () => {
    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
        `(
          'should return all solution interests for a "$role" of company',
          async ({ role }: { role: RoleName }) => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              role
            );
            ((authenticateUser as unknown) as jest.Mock).mockImplementation(
              () => ({
                user: getCurrentUser({
                  companyOverrides: {
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const dbSolutionInterests = await connection
              .getRepository(SolutionInterestsEntity)
              .find();

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: `
                query {
                  solutionInterests {
                    id
                    name
                    systemName
                  }
                }
              `,
            });

            expect(result.data?.solutionInterests).toHaveLength(
              dbSolutionInterests?.length ?? 0
            );
            expect(result.errors).toBeUndefined();
          }
        );
      }
    );

    describe.each`
      companyStatus
      ${CompanyStatus.InvitationDeclined}
      ${CompanyStatus.PendingUserConfirmation}
      ${CompanyStatus.VettingInProgress}
      ${CompanyStatus.Vetoed}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
        `(
          'should return an error for a $role of company',
          async ({ role }: { role: RoleName }) => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              role
            );
            ((authenticateUser as unknown) as jest.Mock).mockImplementation(
              () => ({
                user: getCurrentUser({
                  companyOverrides: {
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: `
              query {
                solutionInterests {
                  id
                }
              }
            `,
            });

            expect(result.data?.solutionInterests).toBeUndefined();

            expect(result.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message: COMPANY_ERROR,
                }),
              ])
            );
          }
        );
      }
    );
  });
});
