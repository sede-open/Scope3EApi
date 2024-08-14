import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { CompanyStatus, RoleName } from '../types';
import { getOrCreateConnection } from '../dbConnection';
import { UserSolutionInterestsEntity } from '../entities/UserSolutionInterests';
import {
  userSolutionInterests2Mock,
  userSolutionInterests3Mock,
  userSolutionInterestsMock,
} from '../mocks/userSolutionInterests';
import { SolutionInterestsEntity } from '../entities/SolutionInterests';
import {
  solutionInterestsMock,
  solutionInterestsMock2,
  solutionInterestsMock3,
  solutionInterestsMock4,
  solutionInterestsMock5,
} from '../mocks/solutionInterests';
import { getCurrentUser, supplierEditorUserMock } from '../mocks/user';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('../auth');

describe('userSolutionInterestsResolvers', () => {
  beforeEach(async () => {
    // add userSolutionInterests into DB
    const connection = await getOrCreateConnection();
    await connection
      .getRepository(SolutionInterestsEntity)
      .save([
        solutionInterestsMock,
        solutionInterestsMock2,
        solutionInterestsMock3,
        solutionInterestsMock4,
        solutionInterestsMock5,
      ]);
  });

  afterEach(async () => {
    const connection = await getOrCreateConnection();
    await connection.getRepository(UserSolutionInterestsEntity).delete({});
  });

  describe('userSolutionInterests', () => {
    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it.each`
          role
          ${RoleName.Admin}
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
        `(
          'should return userSolutionInterests for a "$role" company',
          async ({ role }: { role: RoleName }) => {
            // add userSolutionInterest into DB
            const connection = await getOrCreateConnection();
            await connection
              .getRepository(UserSolutionInterestsEntity)
              .save(userSolutionInterestsMock);

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
                  userSolutionInterests {
                    id
                    solutionInterest {
                      id
                    }
                    createdAt
                    updatedAt
                  }
                }
              `,
            });

            expect(result.data?.userSolutionInterests).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  id: userSolutionInterestsMock.id,
                  solutionInterest: {
                    id: userSolutionInterestsMock.solutionInterestId.toUpperCase(),
                  },
                  createdAt: userSolutionInterestsMock.createdAt,
                  updatedAt: userSolutionInterestsMock.updatedAt,
                }),
              ])
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
          'should return an error for a "$role" company',
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
                  userSolutionInterests {
                    id
                  }
                }
              `,
            });

            expect(result.data?.userSolutionInterests).toBeUndefined();

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

  describe('updateUserSolutionInterests()', () => {
    const updateUserSolutionInterestsMutation = `
      mutation ($input: UpdateUserSolutionInterestsInput!) {
        updateUserSolutionInterests(input: $input) {
          solutionInterest {
            id
          }
        }
      }
    `;

    beforeAll(async () => {
      // add userSolutionInterest into DB
      const connection = await getOrCreateConnection();
      await connection
        .getRepository(UserSolutionInterestsEntity)
        .save(userSolutionInterestsMock);
    });

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
          ${RoleName.Admin}
          ${RoleName.SupplierViewer}
        `(
          'should allow "$role" to update user solution interests',
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
              query: updateUserSolutionInterestsMutation,
              variables: {
                input: {
                  solutionInterestIds: [
                    solutionInterestsMock.id,
                    solutionInterestsMock2.id,
                  ],
                },
              },
            });

            expect(result.errors).toBeUndefined();

            expect(result.data?.updateUserSolutionInterests).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  solutionInterest: {
                    id: solutionInterestsMock.id,
                  },
                }),
                expect.objectContaining({
                  solutionInterest: {
                    id: solutionInterestsMock2.id,
                  },
                }),
              ])
            );
          }
        );

        describe('when updated solution interest IDs include existing and new ID', () => {
          beforeEach(async () => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              RoleName.SupplierEditor
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
          });

          it('should update UserSolutionInterestEntity with the new ID added to the list', async () => {
            const connection = await getOrCreateConnection();
            await connection
              .getRepository(UserSolutionInterestsEntity)
              .save(userSolutionInterestsMock);

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateUserSolutionInterestsMutation,
              variables: {
                input: {
                  solutionInterestIds: [
                    solutionInterestsMock.id,
                    solutionInterestsMock2.id,
                  ],
                },
              },
            });

            const updatedUserSolutionInterestsEntity = await connection
              .getRepository(UserSolutionInterestsEntity)
              .find({ where: { userId: supplierEditorUserMock.id } });

            expect(updatedUserSolutionInterestsEntity).toHaveLength(2);
            expect(result.errors).toBeUndefined();
          });
        });

        describe('when the updated solution interest ID is equal to the existing ID', () => {
          beforeEach(async () => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              RoleName.SupplierEditor
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
          });

          it('should not delete existing solution interest ID or add a duplicate to UserSolutionInterestEntity', async () => {
            const connection = await getOrCreateConnection();
            await connection
              .getRepository(UserSolutionInterestsEntity)
              .save(userSolutionInterestsMock);

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateUserSolutionInterestsMutation,
              variables: {
                input: {
                  solutionInterestIds: [solutionInterestsMock.id],
                },
              },
            });

            expect(result.data?.updateUserSolutionInterests).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  solutionInterest: {
                    id: solutionInterestsMock.id,
                  },
                }),
              ])
            );
            expect(result.errors).toBeUndefined();
          });
        });

        describe('when a single updated solution interest ID is not equal to existing solution interest ID', () => {
          beforeEach(async () => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              RoleName.SupplierEditor
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
          });

          it('should delete existing and replace with updated solution interest ID ', async () => {
            const connection = await getOrCreateConnection();
            if (connection) {
              await connection
                ?.getRepository(UserSolutionInterestsEntity)
                .save(userSolutionInterestsMock);
            }

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateUserSolutionInterestsMutation,
              variables: {
                input: { solutionInterestIds: [solutionInterestsMock2.id] },
              },
            });

            expect(result.data?.updateUserSolutionInterests).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  solutionInterest: {
                    id: solutionInterestsMock2.id,
                  },
                }),
              ])
            );
            expect(result.errors).toBeUndefined();
          });
        });

        describe('when multiple updated solution interest IDs are not equal to multiple existing solution interest IDs', () => {
          it('should delete existing solution interest IDs and replace with updated solution interest IDs', async () => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              RoleName.SupplierEditor
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

            await connection
              .getRepository(UserSolutionInterestsEntity)
              .save([
                userSolutionInterestsMock,
                userSolutionInterests2Mock,
                userSolutionInterests3Mock,
              ]);

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateUserSolutionInterestsMutation,
              variables: {
                input: {
                  solutionInterestIds: [
                    solutionInterestsMock4.id,
                    solutionInterestsMock5.id,
                  ],
                },
              },
            });

            expect(result.data?.updateUserSolutionInterests).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  solutionInterest: {
                    id: solutionInterestsMock4.id,
                  },
                }),
                expect.objectContaining({
                  solutionInterest: {
                    id: solutionInterestsMock5.id,
                  },
                }),
              ])
            );
            expect(result.errors).toBeUndefined();
          });
        });
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
        describe('when updating user solution interests', () => {
          it('should throw an error', async () => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              RoleName.SupplierEditor
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
              query: updateUserSolutionInterestsMutation,
              variables: {
                input: {
                  solutionInterestIds: [
                    solutionInterestsMock.id,
                    solutionInterestsMock2.id,
                  ],
                },
              },
            });

            expect(result.data?.updateUserSolutionInterests).toBeUndefined();

            expect(result.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message: COMPANY_ERROR,
                }),
              ])
            );
          });
        });
      }
    );
  });
});
