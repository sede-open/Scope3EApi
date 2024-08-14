import fetch from 'node-fetch';
import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { INVITE_SENT_SUCCESS } from '../controllers/UserController';
import { getOrCreateConnection } from '../dbConnection';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { CompanyEntity } from '../entities/Company';
import { UserEntity } from '../entities/User';
import { companyMock } from '../mocks/company';
import {
  adminUserMock,
  getCurrentUser,
  supplierEditorUser2Mock,
  supplierEditorUserMock,
} from '../mocks/user';
import { RoleRepository } from '../repositories/RoleRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CompanyStatus, RoleName, UserStatus } from '../types';

jest.mock('node-fetch');
jest.mock('../auth');

describe('userResolvers', () => {
  describe('users', () => {
    const userQuery = `
      query {
        users {
          data {
            id
            email
            firstName
            lastName
            status
            company {
              id
              status
            }
          }
        }
      }
    `;

    describe.each`
      role
      ${RoleName.Admin}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return a list of users', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
          }),
        }));

        const dbUsers = (
          await connection!.getRepository(UserEntity).find()
        ).filter((user) => !user.isDeleted);

        const server = getApolloServer();
        const result = await server.executeOperation({
          query: userQuery,
        });

        expect(result.data?.users.data).toHaveLength(dbUsers.length);
      });
    });

    describe.each`
      role
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should throw an error when requesting users', async () => {
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
          query: userQuery,
        });

        expect(result.data?.users).toBeUndefined();

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

  describe('user', () => {
    const userQuery = `
      query($email: String!) {
        user(email: $email) {
          id
          email
          firstName
          lastName
          status
          company {
            id
            status
          }
        }
      }
    `;

    describe.each`
      role
      ${RoleName.Admin}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return a list of users', async () => {
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
          query: userQuery,
          variables: {
            email: supplierEditorUserMock.email,
          },
        });

        expect(result.data?.user).toEqual(
          expect.objectContaining({
            id: supplierEditorUserMock.id.toUpperCase(),
            email: supplierEditorUserMock.email,
            firstName: supplierEditorUserMock.firstName,
            lastName: supplierEditorUserMock.lastName,
            status: supplierEditorUserMock.status,
          })
        );
      });
    });

    describe.each`
      role
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should throw an error when requesting a user', async () => {
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
          query: userQuery,
          variables: {
            email: supplierEditorUserMock.email,
          },
        });

        expect(result.data?.user).toBeNull();

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

  describe('resendUserInviteToJoinEmail', () => {
    const resendUserInviteToJoinEmailMutation = `
      mutation ($input: ResendUserInviteToJoinEmailInput!) {
        resendUserInviteToJoinEmail(input: $input)
      }
    `;

    const invitedCompany = {
      ...companyMock,
      id: '318df512-7496-4094-bbfb-9cfb67f390da',
      createdBy: supplierEditorUserMock.id,
      status: CompanyStatus.PendingUserConfirmation,
    };

    let invitedUser = getCurrentUser({
      userOverrides: {
        ...supplierEditorUser2Mock,
        id: '97e365ba-b938-4e81-9835-96bea4654859',
      },
      companyOverrides: invitedCompany,
    });

    describe('when current user is an ADMIN', () => {
      describe('on success', () => {
        beforeEach(async () => {
          const connection = await getOrCreateConnection();
          const userRepository = connection.getCustomRepository(UserRepository);
          const roleRepository = connection.getCustomRepository(RoleRepository);
          await connection.getRepository(CompanyEntity).save(invitedCompany);

          await userRepository.deleteUsers([invitedUser.id]);

          const roles = await roleRepository.findAssumedRolesForRoleName(
            RoleName.Admin
          );

          invitedUser = {
            ...invitedUser,
            roles,
          };

          await userRepository.save(invitedUser);
        });

        afterEach(async () => {
          const connection = await getOrCreateConnection();
          const userRepository = connection.getCustomRepository(UserRepository);
          await userRepository.deleteUsers([invitedUser.id]);
          await connection
            .getRepository(CompanyEntity)
            .delete(invitedCompany.id);
        });

        it('should return success message', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(
            RoleName.Admin
          );
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                roles,
              }),
            })
          );
          const server = getApolloServer();
          const result = await server.executeOperation({
            query: resendUserInviteToJoinEmailMutation,
            variables: {
              input: {
                userId: invitedUser.id.toUpperCase(),
              },
            },
          });

          expect(result.errors).toBeUndefined();
          expect(result.data?.resendUserInviteToJoinEmail).toEqual(
            INVITE_SENT_SUCCESS
          );
        });
      });
    });

    describe.each`
      roleName
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `(
      'when current user is $roleName',
      ({ roleName }: { roleName: RoleName }) => {
        it('should throw an error', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(
            roleName
          );
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                roles,
              }),
            })
          );

          const server = getApolloServer();
          const result = await server.executeOperation({
            query: resendUserInviteToJoinEmailMutation,
            variables: {
              input: {
                userId: invitedUser.id,
              },
            },
          });

          expect(result.data?.resendUserInviteToJoinEmail).toBeUndefined();

          expect(result.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: NO_ACCESS_TO_FIELD_ERROR,
              }),
            ])
          );
        });
      }
    );
  });

  describe('activateUserAndCompany', () => {
    const activateUserAndCompanyMutation = `
      mutation {
        activateUserAndCompany {
          id
          status
        }
      }
    `;

    describe('when a pending user does not belong to a company', () => {
      const adminUser = getCurrentUser({
        userOverrides: {
          ...adminUserMock,
          id: 'e5558dfe-75ba-45ef-93ed-633df6f958e6',
          status: UserStatus.Pending,
        },
      });

      beforeEach(async () => {
        const connection = await getOrCreateConnection();
        const userRepository = await connection.getCustomRepository(
          UserRepository
        );

        await userRepository.deleteUsers([adminUser.id]);
        const roleRepository = connection.getCustomRepository(RoleRepository);

        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.Admin
        );

        adminUser.roles = roles;

        await userRepository.save(adminUser);
      });

      afterAll(async () => {
        const connection = await getOrCreateConnection();
        await connection
          .getCustomRepository(UserRepository)
          .deleteUsers([adminUser.id]);
      });

      it('should set user status to ACTIVE', async () => {
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: adminUser,
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: activateUserAndCompanyMutation,
        });

        expect(result.data?.activateUserAndCompany).toEqual(
          expect.objectContaining({
            status: UserStatus.Active,
          })
        );
      });
    });

    describe('when a pending user belongs to a company', () => {
      const pendingCompany = {
        ...companyMock,
        id: '318df512-7496-4094-bbfb-9cfb67f390da',
        createdBy: supplierEditorUserMock.id,
        status: CompanyStatus.PendingUserActivation,
      };

      const pendingCompanyUser = getCurrentUser({
        userOverrides: {
          ...supplierEditorUser2Mock,
          id: '97e365ba-b938-4e81-9835-96bea4654859',
          companyId: pendingCompany.id,
          status: UserStatus.Pending,
        },
        companyOverrides: pendingCompany,
      });

      beforeEach(async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const userRepository = connection.getCustomRepository(UserRepository);
        const companyRepository = connection.getRepository(CompanyEntity);

        await companyRepository.save({ ...pendingCompany, updatedBy: null });
        await userRepository.deleteUsers([pendingCompanyUser.id]);
        await companyRepository.delete(pendingCompany.id);

        await companyRepository.save(pendingCompany);

        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        pendingCompanyUser.roles = roles;
        await userRepository.save(pendingCompanyUser);
      });

      afterAll(async () => {
        const connection = await getOrCreateConnection();
        const userRepository = connection.getCustomRepository(UserRepository);
        const companyRepository = connection.getRepository(CompanyEntity);

        await companyRepository.save({ ...pendingCompany, updatedBy: null });
        await userRepository.deleteUsers([pendingCompanyUser.id]);
        await companyRepository.delete(pendingCompany.id);
      });

      it('should set user status to ACTIVE', async () => {
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: pendingCompanyUser,
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: activateUserAndCompanyMutation,
        });

        expect(result.data?.activateUserAndCompany).toEqual(
          expect.objectContaining({
            status: UserStatus.Active,
          })
        );
      });

      describe('when user company status is PENDING_USER_CONFIRMATION', () => {
        it('should set user company status to ACTIVE', async () => {
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: pendingCompanyUser,
            })
          );

          const server = getApolloServer();

          await server.executeOperation({
            query: activateUserAndCompanyMutation,
          });

          const connection = await getOrCreateConnection();
          const companyAfter = await connection
            ?.getRepository(CompanyEntity)
            .findOne(pendingCompany.id);

          expect(companyAfter?.status).toBe(CompanyStatus.Active);
        });
      });
    });
  });

  describe('companyUser', () => {
    const companyUsersQuery = `
      query {
        companyUsers {
          id
          email
          firstName
          lastName
          status
        }
      }
    `;
    describe.each`
      role
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return a list of users', async () => {
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
          query: companyUsersQuery,
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.companyUsers).toHaveLength(2);
        expect(result.data?.companyUsers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: supplierEditorUserMock.id.toUpperCase(),
              email: supplierEditorUserMock.email,
              firstName: supplierEditorUserMock.firstName,
              lastName: supplierEditorUserMock.lastName,
              status: supplierEditorUserMock.status,
            }),
          ])
        );
      });
    });
  });

  describe('deleteUser', () => {
    const userDeleteMutation = `
      mutation($input: DeleteUserInput!) {
        deleteUser(input: $input)
      }
    `;

    const userToDelete = {
      ...supplierEditorUserMock,
      id: '8dbdbd72-a4e7-451a-af6d-36971248121b',
    };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      await connection
        .getCustomRepository(UserRepository)
        .deleteUsers([userToDelete.id]);

      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );

      await connection
        ?.getRepository(UserEntity)
        .save({ ...userToDelete, roles });
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      await connection
        .getCustomRepository(UserRepository)
        .deleteUsers([userToDelete.id]);
    });

    describe.each`
      role
      ${RoleName.Admin}
      ${RoleName.SupplierEditor}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return deleted user id', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            userOverrides: { companyId: userToDelete.companyId },

            companyOverrides: { id: userToDelete.companyId },
            roles,
          }),
        }));
        const server = getApolloServer();
        const result = await server.executeOperation({
          query: userDeleteMutation,
          variables: {
            input: {
              id: userToDelete.id,
            },
          },
        });
        expect(result.data?.deleteUser).toBe(userToDelete.id.toUpperCase());
      });
    });

    describe.each`
      role
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should throw an error when deleting users', async () => {
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
          query: userDeleteMutation,
          variables: {
            input: { id: userToDelete.id },
          },
        });

        expect(result.data?.users).toBeUndefined();

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

  describe('resendAkamaiInvite', () => {
    const resendAkamaiInviteMutation = `
      mutation($input: ResentAkamaiInviteInput!) {
        resendAkamaiInvite(input: $input)
      }
    `;

    const userToResendInviteTo = {
      ...supplierEditorUserMock,
      id: '8dbdbd72-a4e7-451a-af6d-36971248121b',
    };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      await connection
        .getCustomRepository(UserRepository)
        .deleteUsers([userToResendInviteTo.id]);

      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );

      await connection
        .getRepository(UserEntity)
        .save({ ...userToResendInviteTo, roles });
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      await connection
        .getCustomRepository(UserRepository)
        .deleteUsers([userToResendInviteTo.id]);
    });

    describe.each`
      role
      ${RoleName.Admin}
      ${RoleName.SupplierEditor}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return success message', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            userOverrides: { companyId: supplierEditorUserMock.companyId },

            companyOverrides: { id: supplierEditorUserMock.companyId },
            roles,
          }),
        }));

        const server = getApolloServer();

        ((fetch as unknown) as jest.Mock).mockImplementation(() => ({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        }));

        const result = await server.executeOperation({
          query: resendAkamaiInviteMutation,
          variables: {
            input: {
              userId: supplierEditorUserMock.id,
            },
          },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.resendAkamaiInvite).toBe(INVITE_SENT_SUCCESS);
      });
    });

    describe.each`
      role
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should throw an error when deleting users', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);

        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            userOverrides: { companyId: supplierEditorUserMock.companyId },

            companyOverrides: { id: supplierEditorUserMock.companyId },
            roles,
          }),
        }));

        const server = getApolloServer();
        const result = await server.executeOperation({
          query: resendAkamaiInviteMutation,
          variables: {
            input: { userId: supplierEditorUserMock.id },
          },
        });

        expect(result.data?.resendAkamaiInvite).toBeUndefined();
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
