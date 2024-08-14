import fetch from 'node-fetch';

import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { getOrCreateConnection } from '../dbConnection';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import { CompanyEntity } from '../entities/Company';
import { AppMetaEntity } from '../entities/AppMeta';
import { companyMock, company4Mock } from '../mocks/company';
import { typeaheadSearchResultMock } from '../mocks/dnbTypeaheadSearchResult';
import { dnbTokenMock } from '../mocks/appMeta';
import { getCurrentUser, supplierEditorUserMock } from '../mocks/user';
import {
  AuthProvider,
  CarbonIntensityMetricType,
  CarbonIntensityType,
  CompaniesBenchmarkOrderBy,
  Company,
  CompanyRelationshipType,
  CompanyStatus,
  InviteStatus,
  OrderBy,
  RoleName,
} from '../types';
import {
  ACCEPT_INVITE_SUCCESS,
  CompanyController,
  DECLINE_INVITE_SUCCESS,
} from '../controllers/CompanyController';
import { UserEntity } from '../entities/User';
import { CompanyRelationshipEntity } from '../entities/CompanyRelationship';
import { RoleEntity } from '../entities/Role';
import * as welcomeNewTemplateUtils from '../emailTemplates/welcomeToNewAkamaiUser';
import * as welcomeExistingTemplateUtils from '../emailTemplates/welcomeToExistingAkamaiUser';
import { USER_EXISTS_ERROR_MESSAGE } from '../clients/AkamaiClient';
import { In } from 'typeorm';
import { RoleRepository } from '../repositories/RoleRepository';
import { UserRepository } from '../repositories/UserRepository';
import { USER_COMPANY_ERROR } from '../errors/commonErrorMessages';

jest.mock('node-fetch');
jest.mock('../auth');
jest.mock('../jobs/tasks/email/queue');

describe('companyResolvers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('companies', () => {
    const companiesQuery = `
      query {
        companies {
          data {
            id
            name
            duns
            dnbRegion
            dnbCountry
            dnbCountryIso
            dnbPostalCode
            dnbAddressLineOne
            dnbAddressLineTwo
            users {
              email
            }
          }
          total
        }
      }
    `;

    const companiesQueryWithoutUsers = `
      query($offset: Int, $limit: Int) {
        companies(offset: $offset, limit: $limit) {
          data {
            id
            name
            duns
            dnbRegion
            dnbCountry
            dnbCountryIso
            dnbPostalCode
            dnbAddressLineOne
            dnbAddressLineTwo
          }
          total
        }
      }
    `;

    describe.each`
      role
      ${RoleName.Admin}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      const deletedUser = new UserEntity({
        id: 'c03e642b-c4c3-4d42-b8e7-d8d1b5753af5',
        companyId: companyMock.id,
        firstName: '',
        lastName: '',
        roles: [] as RoleEntity[],
        email: '75786767843782479374',
        isDeleted: true,
        authProvider: AuthProvider.Akamai,
      });

      beforeAll(async () => {
        const connection = await getOrCreateConnection();
        const userRepository = connection.getCustomRepository(UserRepository);
        const roleRepository = connection.getCustomRepository(RoleRepository);

        await userRepository.deleteUsers([deletedUser.id]);

        deletedUser.roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        await userRepository.save(deletedUser);
      });

      afterAll(async () => {
        const connection = await getOrCreateConnection();
        const userRepository = connection.getCustomRepository(UserRepository);
        await userRepository.deleteUsers([deletedUser.id]);
      });

      it('should return companies with users', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
          }),
        }));

        const server = getApolloServer();

        const dbCompanies = await connection
          .getRepository(CompanyEntity)
          .find();

        const result = await server.executeOperation({
          query: companiesQuery,
        });

        // companyMock has one user created in the setup
        const companyMockUsers = result.data?.companies.data.find(
          (e: Company) => e.id === companyMock.id
        )?.users;
        expect(companyMockUsers).toHaveLength(2);
        expect(companyMockUsers[0].email).toBe(supplierEditorUserMock.email);

        expect(result.data?.companies.data).toHaveLength(dbCompanies!.length);
        expect(result.data?.companies.total).toBe(dbCompanies!.length);

        expect(result.errors).toBeUndefined();
      });
    });

    describe.each`
      companyStatus
      ${CompanyStatus.PendingUserActivation}
      ${CompanyStatus.Active}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        describe('when SUPPLIER_EDITOR queries users field', () => {
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
                  companyOverrides: { status: companyStatus },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: companiesQuery,
            });

            expect(result.data?.companies).toBeUndefined();

            expect(result.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message: NO_ACCESS_TO_FIELD_ERROR,
                }),
              ])
            );
          });
        });

        describe('when SUPPLIER_EDITOR does not query users field', () => {
          it('should return companies', async () => {
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
                  companyOverrides: { status: companyStatus },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const dbCompanies = await connection
              .getRepository(CompanyEntity)
              .find();

            const result = await server.executeOperation({
              query: companiesQueryWithoutUsers,
            });

            expect(result.data?.companies.data).toHaveLength(
              dbCompanies!.length
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
        it('should throw an error for a SUPPLIER_EDITOR', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(
            RoleName.SupplierEditor
          );
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                companyOverrides: { status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: companiesQueryWithoutUsers,
          });

          expect(result.data?.companies).toBeUndefined();

          expect(result.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: COMPANY_ERROR,
              }),
            ])
          );
        });
      }
    );
  });

  describe('companyByDuns', () => {
    const companyByDunsQuery = `
      query($duns: String!) {
        companyByDuns(duns: $duns) {
          id
          name
          location
          duns
          dnbRegion
          dnbCountry
          dnbCountryIso
          dnbPostalCode
          dnbAddressLineOne
          dnbAddressLineTwo
        }
      }
    `;

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
        `(
          'should return a company by its DUNS number for a "$role"',
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
                  companyOverrides: { status: companyStatus },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: companyByDunsQuery,
              variables: {
                duns: companyMock.duns,
              },
            });

            expect(result.data?.companyByDuns).toEqual(
              expect.objectContaining({
                id: companyMock.id,
                name: companyMock.name,
                location: companyMock.location,
                duns: companyMock.duns,
                dnbRegion: companyMock.dnbRegion,
                dnbCountry: companyMock.dnbCountry,
                dnbCountryIso: companyMock.dnbCountryIso,
                dnbPostalCode: companyMock.dnbPostalCode,
                dnbAddressLineOne: companyMock.dnbAddressLineOne,
                dnbAddressLineTwo: companyMock.dnbAddressLineTwo,
              })
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
        `(
          'should throw an error for a "$role"',
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
                  companyOverrides: { status: companyStatus },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: companyByDunsQuery,
              variables: {
                duns: companyMock.duns,
              },
            });

            expect(result.data?.companyByDuns).toBeNull();

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

  describe('dnbTypeaheadSearch', () => {
    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        beforeAll(async () => {
          const connection = await getOrCreateConnection();
          await connection.getRepository(AppMetaEntity).save({
            ...dnbTokenMock,
            createdAt: new Date(),
          });
        });

        afterAll(async () => {
          const connection = await getOrCreateConnection();
          if (connection) {
            await connection?.getRepository(AppMetaEntity).delete({});
          }
        });

        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.Admin}
        `(
          'should return D&B company search results for a "$role"',
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
                  companyOverrides: { status: companyStatus },
                  roles,
                }),
              })
            );

            ((fetch as unknown) as jest.Mock).mockResolvedValue({
              ok: true,
              json: jest.fn().mockResolvedValue(typeaheadSearchResultMock),
            });

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: `
                query($searchTerm: String!) {
                  dnbTypeaheadSearch(searchTerm: $searchTerm) {
                    duns
                    primaryName
                    isGlobalUltimate
                    globalUltimateDuns
                    globalUltimatePrimaryName
                  }
                }
              `,
              variables: {
                searchTerm: 'Example',
              },
            });

            expect(result.data?.dnbTypeaheadSearch).toHaveLength(2);
            expect(result.data?.dnbTypeaheadSearch).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  duns:
                    typeaheadSearchResultMock.searchCandidates[0].organization
                      .duns,
                  primaryName:
                    typeaheadSearchResultMock.searchCandidates[0].organization
                      .primaryName,
                  isGlobalUltimate: false,
                  globalUltimateDuns:
                    typeaheadSearchResultMock.searchCandidates[0].organization
                      .corporateLinkage.globalUltimate.duns,
                  globalUltimatePrimaryName:
                    typeaheadSearchResultMock.searchCandidates[0].organization
                      .corporateLinkage.globalUltimate.primaryName,
                }),
                expect.objectContaining({
                  duns:
                    typeaheadSearchResultMock.searchCandidates[1].organization
                      .duns,
                  primaryName:
                    typeaheadSearchResultMock.searchCandidates[1].organization
                      .primaryName,
                  isGlobalUltimate: true,
                  globalUltimateDuns:
                    typeaheadSearchResultMock.searchCandidates[1].organization
                      .corporateLinkage.globalUltimate.duns,
                  globalUltimatePrimaryName:
                    typeaheadSearchResultMock.searchCandidates[1].organization
                      .corporateLinkage.globalUltimate.primaryName,
                }),
              ])
            );
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.SupplierViewer}
        `(
          'should throw an error for a "$role" role',
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
                  companyOverrides: { status: companyStatus },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: `
            query($searchTerm: String!) {
              dnbTypeaheadSearch(searchTerm: $searchTerm) {
                duns
              }
            }
          `,
              variables: {
                searchTerm: 'Example',
              },
            });

            expect(result.data?.dnbTypeaheadSearch).toBeUndefined();
            expect(result.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message: NO_ACCESS_TO_FIELD_ERROR,
                }),
              ])
            );
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
        beforeAll(async () => {
          const connection = await getOrCreateConnection();
          if (connection) {
            await connection?.getRepository(AppMetaEntity).save({
              ...dnbTokenMock,
              createdAt: new Date(),
            });
          }
        });

        afterAll(async () => {
          const connection = await getOrCreateConnection();
          if (connection) {
            await connection?.getRepository(AppMetaEntity).delete({});
          }
        });

        it.each`
          role
          ${RoleName.SupplierEditor}
        `(
          'should return an error for a "$role"',
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
                  companyOverrides: { status: companyStatus },
                  roles,
                }),
              })
            );

            ((fetch as unknown) as jest.Mock).mockResolvedValue({
              ok: true,
              json: jest.fn().mockResolvedValue(typeaheadSearchResultMock),
            });

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: `
            query($searchTerm: String!) {
              dnbTypeaheadSearch(searchTerm: $searchTerm) {
                duns
              }
            }
          `,
              variables: {
                searchTerm: 'Example',
              },
            });

            expect(result.data?.dnbTypeaheadSearch).toBeUndefined();

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

  describe('updateCompanyStatus()', () => {
    const updateCompanyStatusMutation = `
      mutation ($input: UpdateCompanyStatusInput!) {
        updateCompanyStatus(input: $input) {
          id
          status
        }
      }
    `;

    const companyStatusUpdates = {
      id: company4Mock.id,
      status: CompanyStatus.PendingUserActivation,
    };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      await connection?.getRepository(CompanyEntity).save(company4Mock);
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      await connection?.getRepository(CompanyEntity).delete({
        id: In([company4Mock.id]),
      });
    });

    it('should allow ADMIN to update company status', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.Admin
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          roles,
        }),
      }));

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: updateCompanyStatusMutation,
        variables: { input: companyStatusUpdates },
      });

      expect(result.data?.updateCompanyStatus).toEqual(
        expect.objectContaining({
          id: companyStatusUpdates.id,
          status: companyStatusUpdates.status,
        })
      );
      expect(result.errors).toBeUndefined();
    });

    it.each`
      role
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `(
      'should throw when "$role" tries to update a company status',
      async ({ role }: { role: RoleName }) => {
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
          query: updateCompanyStatusMutation,
          variables: { input: companyStatusUpdates },
        });

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: NO_ACCESS_TO_FIELD_ERROR,
            }),
          ])
        );
      }
    );
  });

  describe('acceptCompanyInvite', () => {
    const acceptCompanyInviteMutation = `
      mutation ($input: AcceptCompanyInviteInput!) {
        acceptCompanyInvite(input: $input)
      }
    `;

    const company = {
      ...companyMock,
      id: '04744fb8-8df3-4085-aec8-15128f7bfa86',
      status: CompanyStatus.PendingUserConfirmation,
    };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(CompanyEntity).save(company);
    });

    afterEach(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(CompanyEntity).delete(company.id);
    });

    describe('when user has a role of SUPPLIER_EDITOR', () => {
      it('should allow the user to accept company invite', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            userOverrides: { companyId: company.id },
            companyOverrides: { id: company.id },
            roles,
          }),
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: acceptCompanyInviteMutation,
          variables: { input: { companyId: company.id } },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.acceptCompanyInvite).toEqual(ACCEPT_INVITE_SUCCESS);
      });
    });

    describe.each`
      roleName
      ${RoleName.SupplierViewer}
    `(
      'when user has a role of $roleName',
      ({ roleName }: { roleName: RoleName }) => {
        it('should throw an error when accepting an invite', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(
            roleName
          );
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: company.id },
                companyOverrides: { id: company.id },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: acceptCompanyInviteMutation,
            variables: { input: { companyId: company.id } },
          });

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

    describe('when user does not belong to the company', () => {
      it('should throw an error when accepting an invite', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
          }),
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: acceptCompanyInviteMutation,
          variables: { input: { companyId: company.id } },
        });

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: USER_COMPANY_ERROR,
            }),
          ])
        );
      });
    });
  });

  describe('declineCompanyInvite', () => {
    const declineCompanyInviteMutation = `
      mutation ($input: DeclineCompanyInviteInput!) {
        declineCompanyInvite(input: $input)
      }
    `;

    const company = {
      ...companyMock,
      id: '04744fb8-8df3-4085-aec8-15128f7bfa86',
      status: CompanyStatus.PendingUserConfirmation,
    };

    const user = getCurrentUser({
      userOverrides: {
        id: '0a1a1204-0e9a-4d2b-b33f-b409a3096397',
        companyId: company.id.toUpperCase(),
      },
      companyOverrides: { id: company.id.toUpperCase() },
    });

    const supplierRelationship = {
      id: '8185a175-ddb5-4ffa-b14c-a0447ea7e7fc',
      supplierId: company.id,
      customerId: companyMock.id,
      status: InviteStatus.AwaitingSupplierApproval,
      inviteType: CompanyRelationshipType.Supplier,
      customerApproverId: undefined,
      supplierApproverId: undefined,
      note: 'Just do it',
      createdAt: '2020-08-27 09:11:00',
      updatedAt: '2020-08-27 09:11:00',
    };

    const customerRelationship = {
      id: '02b7b926-6e9c-4d4d-a50f-e87109f1a98d',
      supplierId: companyMock.id,
      customerId: company.id,
      status: InviteStatus.AwaitingCustomerApproval,
      inviteType: CompanyRelationshipType.Customer,
      customerApproverId: undefined,
      supplierApproverId: undefined,
      note: 'Just do it',
      createdAt: '2020-08-27 09:11:00',
      updatedAt: '2020-08-27 09:11:00',
    };

    const input = { companyId: company.id.toUpperCase(), reason: 'No thanks' };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      const companyRepository = connection.getRepository(CompanyEntity);
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const userRepository = connection.getCustomRepository(UserRepository);
      const companyRelationshipRepository = connection.getRepository(
        CompanyRelationshipEntity
      );

      await companyRelationshipRepository.delete([
        supplierRelationship.id,
        customerRelationship.id,
      ]);
      await companyRepository.save({
        ...company,
        updatedBy: null,
        updateByUser: null,
      });
      await userRepository.deleteUsers([user.id]);
      await companyRepository.delete(company.id);

      await companyRepository.save(company);
      user.roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      await userRepository.save(user);

      await companyRelationshipRepository.save(supplierRelationship);
      await companyRelationshipRepository.save(customerRelationship);
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      const companyRepository = connection.getRepository(CompanyEntity);
      const userRepository = connection.getCustomRepository(UserRepository);
      const companyRelationshipRepository = connection.getRepository(
        CompanyRelationshipEntity
      );

      await companyRelationshipRepository.delete([
        supplierRelationship.id,
        customerRelationship.id,
      ]);
      await companyRepository.save({
        ...company,
        updatedBy: null,
        updateByUser: null,
      });
      await userRepository.deleteUsers([user.id]);
      await companyRepository.delete(company.id);
    });

    describe('when user has a role of SUPPLIER_EDITOR', () => {
      it('should allow the user to decline company invite', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const userRepository = connection.getCustomRepository(UserRepository);
        const companyRepository = connection.getRepository(CompanyEntity);
        const companyRelationshipRepository = connection.getRepository(
          CompanyRelationshipEntity
        );
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );

        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: {
            ...user,
            roles,
          },
        }));

        const relationshipsBefore = await companyRelationshipRepository.find({
          where: [{ supplierId: company.id }, { customerId: company.id }],
        });
        expect(relationshipsBefore).toHaveLength(2);

        const usersBefore = await userRepository.find({
          where: { companyId: company.id },
        });
        expect(usersBefore).toHaveLength(1);

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: declineCompanyInviteMutation,
          variables: {
            input,
          },
        });

        const relationshipsAfter = await companyRelationshipRepository.find({
          where: { supplierId: company.id },
        });
        expect(relationshipsAfter).toHaveLength(0);

        const usersAfter = await userRepository.find({
          where: { companyId: company.id },
        });
        expect(usersAfter?.[0].isDeleted).toBe(true);

        const companyAfter = await companyRepository.findOne({
          where: { id: company.id },
        });
        expect(companyAfter?.status).toBe(CompanyStatus.InvitationDeclined);

        expect(result.errors).toBeUndefined();
        expect(result.data?.declineCompanyInvite).toEqual(
          DECLINE_INVITE_SUCCESS
        );
      });
    });

    describe.each`
      roleName
      ${RoleName.SupplierViewer}
    `(
      'when user has a role of $roleName',
      ({ roleName }: { roleName: RoleName }) => {
        it('should throw an error when declining an invite', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(
            roleName
          );

          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: company.id },
                companyOverrides: { id: company.id },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: declineCompanyInviteMutation,
            variables: {
              input,
            },
          });

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

    describe('when user does not belong to the company', () => {
      it('should throw an error when declining an invite', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );

        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
          }),
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: declineCompanyInviteMutation,
          variables: { input },
        });

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: USER_COMPANY_ERROR,
            }),
          ])
        );
      });
    });
  });

  describe('vetoCompany', () => {
    const vetoCompanyMutation = `
      mutation ($input: VetoCompanyInput!) {
        vetoCompany(input: $input) {
          id
          status
        }
      }
    `;

    const company = {
      ...companyMock,
      id: '04744fb8-8df3-4085-aec8-15128f7bfa86',
      status: CompanyStatus.VettingInProgress,
    };

    const supplierRelationship = {
      id: '8185a175-ddb5-4ffa-b14c-a0447ea7e7fc',
      supplierId: company.id,
      customerId: companyMock.id,
      status: InviteStatus.AwaitingSupplierApproval,
      inviteType: CompanyRelationshipType.Supplier,
      customerApproverId: undefined,
      supplierApproverId: undefined,
      note: 'Just do it',
      createdAt: '2020-08-27 09:11:00',
      updatedAt: '2020-08-27 09:11:00',
    };

    const customerRelationship = {
      id: '02b7b926-6e9c-4d4d-a50f-e87109f1a98d',
      supplierId: companyMock.id,
      customerId: company.id,
      status: InviteStatus.AwaitingCustomerApproval,
      inviteType: CompanyRelationshipType.Customer,
      customerApproverId: undefined,
      supplierApproverId: undefined,
      note: 'Just do it',
      createdAt: '2020-08-27 09:11:00',
      updatedAt: '2020-08-27 09:11:00',
    };

    const invitee = getCurrentUser({
      userOverrides: {
        id: '0a1a1204-0e9a-4d2b-b33f-b409a3096399',
        companyId: company.id.toUpperCase(),
      },
      companyOverrides: { id: company.id.toUpperCase() },
    });

    const input = { companyId: company.id.toUpperCase() };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      const companyRepository = connection.getRepository(CompanyEntity);
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const userRepository = connection.getCustomRepository(UserRepository);
      const companyRelationshipRepository = connection.getRepository(
        CompanyRelationshipEntity
      );

      await companyRelationshipRepository.delete([
        supplierRelationship.id,
        customerRelationship.id,
      ]);
      await companyRepository.save({
        ...company,
        updatedBy: null,
        updateByUser: null,
      });
      await userRepository.deleteUsers([invitee.id]);
      await companyRepository.delete(company.id);

      await companyRepository.save(company);

      invitee.roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      await userRepository.save(invitee);
      await companyRelationshipRepository.save(supplierRelationship);
      await companyRelationshipRepository.save(customerRelationship);
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      const companyRepository = connection.getRepository(CompanyEntity);
      const userRepository = connection.getCustomRepository(UserRepository);
      const companyRelationshipRepository = connection.getRepository(
        CompanyRelationshipEntity
      );

      await companyRelationshipRepository.delete([
        supplierRelationship.id,
        customerRelationship.id,
      ]);
      await companyRepository.save({
        ...company,
        updatedBy: null,
        updateByUser: null,
      });
      await userRepository.deleteUsers([invitee.id]);
      await companyRepository.delete(company.id);
    });

    describe.each`
      role
      ${RoleName.Admin}
    `('when current user has $role', ({ role }: { role: RoleName }) => {
      it('should allow the user to veto a company', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);

        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
            userOverrides: { companyId: company.id.toUpperCase() },
            companyOverrides: { id: company.id.toUpperCase() },
          }),
        }));

        const usersBefore = await connection.getRepository(UserEntity).find({
          where: { companyId: company.id.toUpperCase() },
        });
        expect(usersBefore).toHaveLength(1);

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: vetoCompanyMutation,
          variables: {
            input,
          },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.vetoCompany).toEqual(
          expect.objectContaining({
            id: company.id,
            status: CompanyStatus.Vetoed,
          })
        );

        const usersAfter = await connection?.getRepository(UserEntity).find({
          where: { companyId: company.id },
        });
        expect(usersAfter?.[0].isDeleted).toBe(true);

        const companyAfter = await connection
          ?.getRepository(CompanyEntity)
          .findOne({
            where: { id: company.id },
          });
        expect(companyAfter?.status).toBe(CompanyStatus.Vetoed);
      });
    });

    describe.each`
      role
      ${RoleName.SupplierViewer}
      ${RoleName.SupplierEditor}
    `('when user has a role of $roleName', ({ role }: { role: RoleName }) => {
      it('should throw an error when vetoing an invite', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({ roles }),
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: vetoCompanyMutation,
          variables: {
            input,
          },
        });

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

  describe('approveCompany', () => {
    const approveCompanyMutation = `
      mutation ($input: ApproveCompanyInput!) {
        approveCompany(input: $input) {
          id
          status
        }
      }
    `;

    const company = {
      ...companyMock,
      id: '04744fb8-8df3-4085-aec8-15128f7bfa86',
      status: CompanyStatus.VettingInProgress,
    };

    const supplierRelationship = {
      id: '8185a175-ddb5-4ffa-b14c-a0447ea7e7fc',
      supplierId: company.id,
      customerId: companyMock.id,
      status: InviteStatus.AwaitingSupplierApproval,
      inviteType: CompanyRelationshipType.Supplier,
      customerApproverId: undefined,
      supplierApproverId: undefined,
      note: 'Just do it',
      createdAt: '2020-08-27 09:11:00',
      updatedAt: '2020-08-27 09:11:00',
    };

    const customerRelationship = {
      id: '02b7b926-6e9c-4d4d-a50f-e87109f1a98d',
      supplierId: companyMock.id,
      customerId: company.id,
      status: InviteStatus.AwaitingCustomerApproval,
      inviteType: CompanyRelationshipType.Customer,
      customerApproverId: undefined,
      supplierApproverId: undefined,
      note: 'Just do it',
      createdAt: '2020-08-27 09:11:00',
      updatedAt: '2020-08-27 09:11:00',
    };

    const invitee = getCurrentUser({
      userOverrides: {
        id: '0a1a1204-0e9a-4d2b-b33f-b409a3096399',
        companyId: company.id.toUpperCase(),
      },
      companyOverrides: { id: company.id.toUpperCase() },
    });

    const input = { companyId: company.id.toUpperCase() };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      const companyRepository = connection.getRepository(CompanyEntity);
      const userRepository = connection.getCustomRepository(UserRepository);
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const companyRelationshipRepository = connection.getRepository(
        CompanyRelationshipEntity
      );

      await companyRelationshipRepository.delete([
        supplierRelationship.id,
        customerRelationship.id,
      ]);
      await companyRepository.save({
        ...company,
        updatedBy: null,
        updateByUser: null,
      });
      await userRepository.deleteUsers([invitee.id]);
      await companyRepository.delete(company.id);

      await companyRepository.save(company);

      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      invitee.roles = roles;
      await userRepository.save(invitee);
      await companyRelationshipRepository.save(supplierRelationship);
      await companyRelationshipRepository.save(customerRelationship);
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      const companyRepository = connection.getRepository(CompanyEntity);
      const userRepository = connection.getCustomRepository(UserRepository);
      const companyRelationshipRepository = connection.getRepository(
        CompanyRelationshipEntity
      );

      await companyRelationshipRepository.delete([
        supplierRelationship.id,
        customerRelationship.id,
      ]);
      await companyRepository.save({
        ...company,
        updatedBy: null,
        updateByUser: null,
      });
      await userRepository.deleteUsers([invitee.id]);
      await companyRepository.delete(company.id);
    });

    describe.each`
      role
      ${RoleName.Admin}
    `('when current user has $role', ({ role }: { role: RoleName }) => {
      beforeAll(async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(role);

        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            roles,
          }),
        }));
      });

      it('should allow the user to approve a company', async () => {
        const connection = await getOrCreateConnection();

        const server = getApolloServer();

        ((fetch as unknown) as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ stat: 'ok' }),
        });

        const result = await server.executeOperation({
          query: approveCompanyMutation,
          variables: {
            input,
          },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.approveCompany).toEqual(
          expect.objectContaining({
            id: company.id,
            status: CompanyStatus.PendingUserActivation,
          })
        );

        const companyAfter = await connection
          .getRepository(CompanyEntity)
          .findOne({
            where: { id: company.id },
          });
        expect(companyAfter?.status).toBe(CompanyStatus.PendingUserActivation);
      });

      describe('when company users are new to Akamai', () => {
        it('should trigger new user welcome email', async () => {
          jest.spyOn(
            welcomeNewTemplateUtils,
            'getWelcomeToNewAkamaiUserTemplate'
          );

          const server = getApolloServer();

          ((fetch as unknown) as jest.Mock).mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ stat: 'ok' }),
          });

          await server.executeOperation({
            query: approveCompanyMutation,
            variables: {
              input,
            },
          });

          expect(
            welcomeNewTemplateUtils.getWelcomeToNewAkamaiUserTemplate
          ).toHaveBeenCalledTimes(1);
        });
      });

      describe('when company users exist in Akamai', () => {
        it('should trigger existing user welcome email', async () => {
          jest.spyOn(
            welcomeExistingTemplateUtils,
            'getWelcomeToExistingAkamaiUserTemplate'
          );

          const server = getApolloServer();

          ((fetch as unknown) as jest.Mock).mockImplementation(() => ({
            ok: true,
            json: jest.fn().mockResolvedValue({
              stat: 'not ok',
              error: 'Some error',
              error_details: {
                emailAddress: [USER_EXISTS_ERROR_MESSAGE],
              },
              invalid_fields: {
                emailAddress: 'emailAddress',
              },
            }),
          }));

          await server.executeOperation({
            query: approveCompanyMutation,
            variables: {
              input,
            },
          });

          expect(
            welcomeExistingTemplateUtils.getWelcomeToExistingAkamaiUserTemplate
          ).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe.each`
      role
      ${RoleName.SupplierViewer}
      ${RoleName.SupplierEditor}
    `('when user has a role of $roleName', ({ role }: { role: RoleName }) => {
      it('should throw an error when approving a company', async () => {
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
          query: approveCompanyMutation,
          variables: {
            input,
          },
        });

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

  describe('companiesBenchmark', () => {
    const companiesBenchmarkQuery = `
      query ($input: CompaniesBenchmarkInput!) {
        companiesBenchmark(input: $input) {
          data {
            companyId
            companyName
          }
          total
        }
      }
    `;
    it('calls companyController companiesBenchmark method with the correct arguments', async () => {
      const spy = jest.spyOn(CompanyController.prototype, 'companiesBenchmark');
      const currentUser = getCurrentUser({});
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: currentUser,
      }));

      const input = {
        selectedCompanyId: '123',
        intensityMetric: CarbonIntensityMetricType.BusinessTravelPerPassengerKm,
        intensityType: CarbonIntensityType.Estimated,
        limit: 10,
        offset: 0,
        order: OrderBy.Asc,
        orderBy: CompaniesBenchmarkOrderBy.AnnualEmissionVariance,
      };

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: companiesBenchmarkQuery,
        variables: {
          input,
        },
      });

      expect(result.errors).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ user: currentUser })
      );
    });
  });
});
