import faker from 'faker';

import { getApolloServer } from '../apollo';
import { getOrCreateConnection } from '../dbConnection';
import { CategoryEntity } from '../entities/Category';
import { EmissionAllocationEntity } from '../entities/EmissionAllocation';
import { cat1Mock } from '../mocks/category';
import { companyMock } from '../mocks/company';
import { authenticateUser } from '../auth';
import {
  emissionAllocationSentBySupplier,
  emissionAllocationSentByMe,
  externalEmissionAllocation,
  emissionAllocationRequestedByMe,
} from '../mocks/emissionAllocation';
import {
  RoleName,
  CompanyRelationshipType,
  EmissionAllocationStatus,
  EmissionAllocationMethod,
  InviteStatus,
  CompanyStatus,
} from '../types';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import { actualMock, baselineMock } from '../mocks/emission';
import { getCurrentUser, supplierEditorUserMock } from '../mocks/user';
import { CompanyRelationshipEntity } from '../entities/CompanyRelationship';
import {
  companyCustomerMock,
  companySupplierMock,
} from '../mocks/companyRelationship';
import { addJobSendEmailToQueue } from '../jobs/tasks/email/queue';
import { RoleRepository } from '../repositories/RoleRepository';
import { CorporateEmissionAccessEntity } from '../entities/CorporateEmissionAccess';
import { getCorporateEmissionAccessMock } from '../mocks/emissionAccess';

jest.mock('../auth');
jest.mock('../jobs/tasks/email/queue');

describe('emissionAllocationResolvers', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    process.env.ENVIRONMENT = 'staging';

    ((addJobSendEmailToQueue as unknown) as jest.Mock).mockImplementation(
      () => undefined
    );
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('emissionAllocations', () => {
    const emissionAllocationsQuery = `
      query (
        $companyId: UUID!,
        $emissionAllocation: EmissionAllocationDirection,
        $statuses: [EmissionAllocationStatus!],
        $year: Int
      ) {
        emissionAllocations(
          companyId: $companyId,
          emissionAllocation: $emissionAllocation,
          statuses: $statuses,
          year: $year
        ) {
          id
          status
          year
          type
          allocationMethod
          emissions
          note
          category {
            name
          }
          supplier {
            id
            name
          }
          customer {
            id
            name
          }
          supplierApprover {
            id
            firstName
          }
          customerApprover {
            id
            firstName
          }
        }
      }
    `;

    beforeAll(async () => {
      const connection = await getOrCreateConnection();
      if (connection) {
        await connection.getRepository(CategoryEntity).save(cat1Mock);
        await connection
          .getRepository(CorporateEmissionEntity)
          .save(baselineMock);
        await connection
          .getRepository(EmissionAllocationEntity)
          .save(emissionAllocationSentBySupplier);
        await connection
          .getRepository(EmissionAllocationEntity)
          .save(emissionAllocationSentByMe);
        await connection
          .getRepository(EmissionAllocationEntity)
          .save(externalEmissionAllocation);
      }
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(EmissionAllocationEntity).delete({});
      await connection.getRepository(CategoryEntity).delete(cat1Mock.id);
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
          ${RoleName.SupplierViewer}
        `(
          'should return all allocations for a $role',
          async ({
            role,
          }: {
            role: RoleName;
            companyRelationship?: CompanyRelationshipType;
          }) => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: emissionAllocationsQuery,
              variables: { companyId: companyMock.id },
            });

            expect(result.data?.emissionAllocations).toHaveLength(2);
            expect(result.data?.emissionAllocations).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  id: emissionAllocationSentBySupplier.id,
                }),
                expect.objectContaining({
                  id: emissionAllocationSentByMe.id,
                }),
              ])
            );
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.Admin}
        `('should not let an $role query company relationships', async () => {
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: {
                  id: companyMock.id,
                  status: companyStatus,
                },
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: emissionAllocationsQuery,
            variables: {
              companyId: companyMock.id,
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
          'should return an error for a $role',
          async ({
            role,
          }: {
            role: RoleName;
            companyRelationship?: CompanyRelationshipType;
          }) => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: emissionAllocationsQuery,
              variables: { companyId: companyMock.id },
            });

            expect(result.data?.emissionAllocations).toBeUndefined();

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

  describe('createEmissionAllocation', () => {
    const createEmissionAllocationMutation = `
      mutation (
        $input: CreateEmissionAllocationInput!
      ) {
        createEmissionAllocation(input: $input) {
          id
          year
          status
          type
          emissions
          note
          supplierApprover {
            id
          }
          customerApprover {
            id
          }
          supplier {
            id
          }
          customer {
            id
          }
          allocationMethod
          category {
            name
          }
          addedToCustomerScopeTotal
        }
      }
    `;

    const supplierInput = {
      supplierId: emissionAllocationSentByMe.supplierId,
      customerId: emissionAllocationSentByMe.customerId,
      year: emissionAllocationSentByMe.year,
      emissions: emissionAllocationSentByMe.emissions,
      supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
      allocationMethod: emissionAllocationSentByMe.allocationMethod,
    };

    const customerInput = {
      supplierId: emissionAllocationRequestedByMe.supplierId,
      customerId: emissionAllocationRequestedByMe.customerId,
      year: emissionAllocationRequestedByMe.year,
      note: emissionAllocationRequestedByMe.note,
      customerEmissionId: emissionAllocationRequestedByMe.customerEmissionId,
    };

    beforeAll(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(CategoryEntity).save(cat1Mock);
      await connection
        .getRepository(CorporateEmissionEntity)
        .save({ ...baselineMock, year: emissionAllocationSentByMe.year });
      await connection.getRepository(CompanyRelationshipEntity).save({
        ...companySupplierMock,
        customerId: emissionAllocationSentByMe.customerId,
        supplierId: emissionAllocationSentByMe.supplierId,
      });
      await connection.getRepository(CompanyRelationshipEntity).save({
        ...companyCustomerMock,
        status: InviteStatus.Approved,
        customerId: emissionAllocationRequestedByMe.customerId,
        supplierId: emissionAllocationRequestedByMe.supplierId,
      });
    });

    afterEach(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(EmissionAllocationEntity).delete({});
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(CategoryEntity).delete(cat1Mock.id);
      await connection
        .getRepository(CorporateEmissionEntity)
        .delete(baselineMock.id);
      await connection
        .getRepository(CompanyRelationshipEntity)
        .delete(companySupplierMock.id);
      await connection
        .getRepository(CompanyRelationshipEntity)
        .delete(companyCustomerMock.id);
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        describe('when a user represents a supplier', () => {
          it('should allow SUPPLIER_EDITOR to create an emission allocation', async () => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: createEmissionAllocationMutation,
              variables: {
                input: supplierInput,
              },
            });

            expect(result.data?.createEmissionAllocation).toEqual(
              expect.objectContaining({
                year: emissionAllocationSentByMe.year,
                emissions: emissionAllocationSentByMe.emissions,
                allocationMethod: emissionAllocationSentByMe.allocationMethod,
                customer: {
                  id: emissionAllocationSentByMe.customerId,
                },
                supplier: {
                  id: emissionAllocationSentByMe.supplierId,
                },
                supplierApprover: {
                  id: supplierEditorUserMock.id.toUpperCase(),
                },
                status: EmissionAllocationStatus.AwaitingApproval,
              })
            );
          });
        });

        describe('when the user represents a customer', () => {
          it('should allow SUPPLIER_EDITOR to request an emission allocation', async () => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: createEmissionAllocationMutation,
              variables: {
                input: customerInput,
              },
            });

            expect(result.data?.createEmissionAllocation).toEqual(
              expect.objectContaining({
                year: emissionAllocationRequestedByMe.year,
                note: emissionAllocationRequestedByMe.note,
                customer: {
                  id: emissionAllocationRequestedByMe.customerId,
                },
                supplier: {
                  id: emissionAllocationRequestedByMe.supplierId,
                },
                status: EmissionAllocationStatus.Requested,
              })
            );
          });
        });

        it.each`
          role
          ${RoleName.SupplierViewer}
        `(
          'should throw an error if "$role" tries to create allocations',
          async ({
            role,
          }: {
            role: RoleName;
            companyRelationship?: CompanyRelationshipType;
          }) => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: createEmissionAllocationMutation,
              variables: {
                input: supplierInput,
              },
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
        describe('when a user represents a supplier', () => {
          it('should allow SUPPLIER_EDITOR to create an emission allocation', async () => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: createEmissionAllocationMutation,
              variables: {
                input: supplierInput,
              },
            });

            expect(result.data?.createEmissionAllocation).toBeUndefined();

            expect(result.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  message: COMPANY_ERROR,
                }),
              ])
            );
          });
        });

        describe('when the user represents a customer', () => {
          it('should allow SUPPLIER_EDITOR to request an emission allocation', async () => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: createEmissionAllocationMutation,
              variables: {
                input: customerInput,
              },
            });

            expect(result.data?.createEmissionAllocation).toBeUndefined();

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

  describe('updateEmissionAllocation', () => {
    const updateEmissionAllocationMutation = `
      mutation (
        $input: UpdateEmissionAllocationInput!
      ) {
        updateEmissionAllocation(input: $input) {
          id
          emissions
          allocationMethod
          status
          category {
            id
          }
        }
      }
    `;

    beforeAll(async () => {
      const connection = await getOrCreateConnection();

      await connection.getRepository(CategoryEntity).save(cat1Mock);
      await connection.getRepository(CompanyRelationshipEntity).save({
        ...companySupplierMock,
        id: faker.random.uuid(),
        customerId: emissionAllocationSentByMe.customerId,
        supplierId: emissionAllocationSentByMe.supplierId,
      });
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(CategoryEntity).delete(cat1Mock.id);
      await connection.getRepository(CompanyRelationshipEntity).delete({});
    });

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      //create corporate emission access value and set the id to emission_id in the save below
      const access: Partial<CorporateEmissionAccessEntity> = getCorporateEmissionAccessMock();
      const result = await connection
        .getRepository(CorporateEmissionEntity)
        .save({
          ...baselineMock,
          year: emissionAllocationSentByMe.year,
        });
      access.emissionId = result.id;
      await connection
        .getRepository(CorporateEmissionAccessEntity)
        .save(access);
      await connection.getRepository(CorporateEmissionEntity).save({
        ...actualMock,
        companyId: emissionAllocationSentByMe.customerId,
        year: emissionAllocationSentByMe.year,
      });
    });

    afterEach(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(EmissionAllocationEntity).delete({});
      await connection.getRepository(CorporateEmissionEntity).delete({});
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        describe('when user represents a supplier', () => {
          describe('when allocation has been requested by the customer', () => {
            it('should allow SUPPLIER_EDITOR to update an emission allocation to AWAITING_APPROVAL', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentByMe,
                status: EmissionAllocationStatus.Requested,
              });

              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentByMe.id,
                emissions: 987655,
                supplierEmissionId:
                  emissionAllocationSentByMe.supplierEmissionId,
                allocationMethod: EmissionAllocationMethod.Physical,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentByMe.id,
                  emissions: input.emissions,
                  allocationMethod: input.allocationMethod,
                  status: EmissionAllocationStatus.AwaitingApproval,
                })
              );
            });

            it('should allow SUPPLIER_EDITOR to dismiss an emission allocation request', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentByMe,
                status: EmissionAllocationStatus.Requested,
              });

              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentByMe.id,
                status: EmissionAllocationStatus.RequestDismissed,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentByMe.id,
                  status: EmissionAllocationStatus.RequestDismissed,
                })
              );
            });
          });

          describe('when allocation has been approved by the customer', () => {
            it('should allow SUPPLIER_EDITOR to update an allocation and remove it from customer scope 3', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentByMe,
                addedToCustomerScopeTotal: true,
                customerEmissionId: actualMock.id,
                status: EmissionAllocationStatus.Approved,
              });

              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentByMe.id,
                emissions: 100,
                supplierEmissionId:
                  emissionAllocationSentByMe.supplierEmissionId,
                allocationMethod: EmissionAllocationMethod.Physical,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              const updatedEmission = await connection
                .getRepository(CorporateEmissionEntity)
                .findOne({ id: actualMock.id });

              expect(updatedEmission?.scope3).toBe(
                (actualMock?.scope3 ?? 0) - emissionAllocationSentByMe.emissions
              );

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentByMe.id,
                  emissions: input.emissions,
                  allocationMethod: input.allocationMethod,
                  status: EmissionAllocationStatus.AwaitingApproval,
                })
              );
            });
          });

          it.each`
            role
            ${RoleName.SupplierViewer}
          `(
            'should throw an error if "$role" tries to update allocations',
            async ({
              role,
            }: {
              role: RoleName;
              companyRelationship?: CompanyRelationshipType;
            }) => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              const server = getApolloServer();

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input: {
                    id: emissionAllocationSentByMe.id,
                    emissions: 100,
                    supplierEmissionId:
                      emissionAllocationSentByMe.supplierEmissionId,
                    allocationMethod: EmissionAllocationMethod.Physical,
                  },
                },
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

        describe('when user represents a customer', () => {
          describe('when accepting allocation', () => {
            it('should allow SUPPLIER_EDITOR to add to their scope 3', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentBySupplier,
                customerEmissionId: null,
                categoryId: null,
                status: EmissionAllocationStatus.AwaitingApproval,
              });
              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentBySupplier.id,
                categoryId: cat1Mock.id,
                customerEmissionId: baselineMock.id,
                status: EmissionAllocationStatus.Approved,
                addedToCustomerScopeTotal: true,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              // check that baseline mock was correctly updated as well
              const updatedEmission = await connection
                .getRepository(CorporateEmissionEntity)
                .findOne({ id: baselineMock.id });

              expect(updatedEmission?.scope3).toBe(
                (baselineMock?.scope3 ?? 0) +
                  emissionAllocationSentBySupplier.emissions
              );

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Approved,
                  category: {
                    id: input.categoryId,
                  },
                })
              );
            });

            it('should allow SUPPLIER_EDITOR to include in their scope 3', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentBySupplier,
                customerEmissionId: null,
                categoryId: null,
                status: EmissionAllocationStatus.AwaitingApproval,
              });

              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentBySupplier.id,
                categoryId: cat1Mock.id,
                customerEmissionId: baselineMock.id,
                status: EmissionAllocationStatus.Approved,
                addedToCustomerScopeTotal: false,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              // check that baseline mock was not updated
              const updatedEmission = await connection
                .getRepository(CorporateEmissionEntity)
                .findOne({ id: baselineMock.id });

              expect(updatedEmission?.scope3).toBe(baselineMock?.scope3);

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Approved,
                  category: {
                    id: input.categoryId,
                  },
                })
              );
            });
          });

          describe('when accepting an allocation that has been updated', () => {
            it('should allow SUPPLIER_EDITOR to add to their scope 3', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentBySupplier,
                customerEmissionId: null,
                categoryId: null,
                status: EmissionAllocationStatus.AwaitingApproval,
              });

              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentBySupplier.id,
                categoryId: cat1Mock.id,
                customerEmissionId: baselineMock.id,
                status: EmissionAllocationStatus.Approved,
                addedToCustomerScopeTotal: true,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              // check that baseline mock was correctly updated as well
              const updatedEmission = await connection
                .getRepository(CorporateEmissionEntity)
                .findOne({ id: baselineMock.id });

              expect(updatedEmission?.scope3).toBe(
                (baselineMock?.scope3 ?? 0) +
                  emissionAllocationSentBySupplier.emissions
              );

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Approved,
                  category: {
                    id: input.categoryId,
                  },
                })
              );
            });

            it('should allow SUPPLIER_EDITOR to add to their scope 3', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentBySupplier,
                customerEmissionId: null,
                categoryId: null,
                status: EmissionAllocationStatus.AwaitingApproval,
                addedToCustomerScopeTotal: true,
              });

              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentBySupplier.id,
                categoryId: cat1Mock.id,
                customerEmissionId: baselineMock.id,
                status: EmissionAllocationStatus.Approved,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              // check that baseline mock was correctly updated as well
              const updatedEmission = await connection
                .getRepository(CorporateEmissionEntity)
                .findOne({ id: baselineMock.id });

              expect(updatedEmission?.scope3).toBe(
                (baselineMock?.scope3 ?? 0) +
                  emissionAllocationSentBySupplier.emissions
              );

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Approved,
                  category: {
                    id: input.categoryId,
                  },
                })
              );
            });
          });

          describe('when rejecting allocation', () => {
            describe('when it is a new allocation', () => {
              it('should allow SUPPLIER_EDITOR to update allocation', async () => {
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
                      userOverrides: { companyId: companyMock.id },
                      companyOverrides: {
                        id: companyMock.id,
                        status: companyStatus,
                      },
                      roles,
                    }),
                  })
                );

                await connection.getRepository(EmissionAllocationEntity).save({
                  ...emissionAllocationSentBySupplier,
                  customerEmissionId: null,
                  categoryId: null,
                  status: EmissionAllocationStatus.AwaitingApproval,
                });

                const server = getApolloServer();

                const input = {
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Rejected,
                };

                const result = await server.executeOperation({
                  query: updateEmissionAllocationMutation,
                  variables: {
                    input,
                  },
                });

                expect(result.data?.updateEmissionAllocation).toEqual(
                  expect.objectContaining({
                    id: emissionAllocationSentBySupplier.id,
                    status: EmissionAllocationStatus.Rejected,
                  })
                );
              });
            });

            describe('when emissions allocation status is changed to rejected', () => {
              it('should remove references to customer emission ID ', async () => {
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
                      userOverrides: { companyId: companyMock.id },
                      companyOverrides: {
                        id: companyMock.id,
                        status: companyStatus,
                      },
                      roles,
                    }),
                  })
                );

                await connection.getRepository(EmissionAllocationEntity).save({
                  ...emissionAllocationSentBySupplier,
                  customerEmissionId: baselineMock.id,
                  categoryId: null,
                  status: EmissionAllocationStatus.AwaitingApproval,
                });

                const server = getApolloServer();

                const input = {
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Rejected,
                };

                const result = await server.executeOperation({
                  query: updateEmissionAllocationMutation,
                  variables: {
                    input,
                  },
                });

                expect(result.data?.updateEmissionAllocation).toEqual(
                  expect.objectContaining({
                    id: emissionAllocationSentBySupplier.id,
                    status: EmissionAllocationStatus.Rejected,
                  })
                );

                const updatedEmissionAllocation = await connection
                  .getRepository(EmissionAllocationEntity)
                  .findOne({ id: baselineMock.id });

                expect(updatedEmissionAllocation?.customerEmissionId).toBe(
                  undefined
                );
              });
            });

            describe('when it is a previously accepted allocation added in scope 3', () => {
              it('should allow SUPPLIER_EDITOR to update allocation', async () => {
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
                      userOverrides: { companyId: companyMock.id },
                      companyOverrides: {
                        id: companyMock.id,
                        status: companyStatus,
                      },
                      roles,
                    }),
                  })
                );

                await connection.getRepository(EmissionAllocationEntity).save({
                  ...emissionAllocationSentBySupplier,
                  customerEmissionId: baselineMock.id,
                  status: EmissionAllocationStatus.Approved,
                  addedToCustomerScopeTotal: true,
                });

                const server = getApolloServer();

                const input = {
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Rejected,
                };

                const result = await server.executeOperation({
                  query: updateEmissionAllocationMutation,
                  variables: {
                    input,
                  },
                });

                // check that baseline mock was correctly updated as well
                const updatedEmission = await connection
                  .getRepository(CorporateEmissionEntity)
                  .findOne({ id: baselineMock.id });

                expect(updatedEmission?.scope3).toBe(
                  (baselineMock?.scope3 ?? 0) -
                    emissionAllocationSentBySupplier.emissions
                );

                expect(result.data?.updateEmissionAllocation).toEqual(
                  expect.objectContaining({
                    id: emissionAllocationSentBySupplier.id,
                    status: EmissionAllocationStatus.Rejected,
                  })
                );
              });
            });

            describe('when it is a previously accepted allocation included in scope 3', () => {
              it('should allow SUPPLIER_EDITOR to update allocation', async () => {
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
                      userOverrides: { companyId: companyMock.id },
                      companyOverrides: {
                        id: companyMock.id,
                        status: companyStatus,
                      },
                      roles,
                    }),
                  })
                );

                await connection.getRepository(EmissionAllocationEntity).save({
                  ...emissionAllocationSentBySupplier,
                  customerEmissionId: baselineMock.id,
                  status: EmissionAllocationStatus.Approved,
                  addedToCustomerScopeTotal: false,
                });

                const server = getApolloServer();

                const input = {
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Rejected,
                };

                const result = await server.executeOperation({
                  query: updateEmissionAllocationMutation,
                  variables: {
                    input,
                  },
                });

                // check that baseline mock was correctly updated as well
                const updatedEmission = await connection
                  .getRepository(CorporateEmissionEntity)
                  .findOne({ id: baselineMock.id });

                expect(updatedEmission?.scope3).toBe(baselineMock?.scope3);

                expect(result.data?.updateEmissionAllocation).toEqual(
                  expect.objectContaining({
                    id: emissionAllocationSentBySupplier.id.toUpperCase(),
                    status: EmissionAllocationStatus.Rejected,
                  })
                );
              });
            });
          });

          describe('when re-requesting a dismissed allocation', () => {
            it('should allow SUPPLIER_EDITOR to update allocation', async () => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentBySupplier,
                customerEmissionId: null,
                categoryId: null,
                status: EmissionAllocationStatus.RequestDismissed,
              });

              const server = getApolloServer();

              const input = {
                id: emissionAllocationSentBySupplier.id,
                status: EmissionAllocationStatus.Requested,
              };

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input,
                },
              });

              expect(result.data?.updateEmissionAllocation).toEqual(
                expect.objectContaining({
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Requested,
                })
              );
            });
          });

          it.each`
            role
            ${RoleName.SupplierViewer}
          `(
            'should throw an error if "$role" tries to update allocations',
            async ({
              role,
            }: {
              role: RoleName;
              companyRelationship?: CompanyRelationshipType;
            }) => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              const server = getApolloServer();

              const result = await server.executeOperation({
                query: updateEmissionAllocationMutation,
                variables: {
                  input: {
                    id: emissionAllocationSentBySupplier.id,
                    status: EmissionAllocationStatus.Rejected,
                  },
                },
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
        describe('when updating an emission allocation', () => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateEmissionAllocationMutation,
              variables: {
                input: {
                  id: emissionAllocationSentBySupplier.id,
                  status: EmissionAllocationStatus.Rejected,
                },
              },
            });

            expect(result.data?.updateEmissionAllocation).toBeUndefined();

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

  describe('deleteEmissionAllocation', () => {
    const deleteEmissionAllocationMutation = `
      mutation (
        $input: DeleteEmissionAllocationInput!
      ) {
        deleteEmissionAllocation(input: $input)
      }
    `;

    beforeAll(async () => {
      const connection = await getOrCreateConnection();

      await connection.getRepository(CategoryEntity).save(cat1Mock);
      await connection.getRepository(CompanyRelationshipEntity).save({
        ...companySupplierMock,
        id: faker.random.uuid(),
        customerId: emissionAllocationSentByMe.customerId,
        supplierId: emissionAllocationSentByMe.supplierId,
      });
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(CategoryEntity).delete(cat1Mock.id);
      await connection.getRepository(CompanyRelationshipEntity).delete({});
    });

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );

      const editorRole = roles.find(
        (role) => role.name === RoleName.SupplierEditor
      );

      if (!editorRole) {
        throw new Error(
          'Could not find editor role which is a dependency for this test'
        );
      }

      await connection.getRepository(CorporateEmissionEntity).save({
        ...actualMock,
        companyId: emissionAllocationSentByMe.customerId,
        year: emissionAllocationSentByMe.year,
      });

      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: {
          id: supplierEditorUserMock.id.toUpperCase(),
          companyId: supplierEditorUserMock.companyId,
          role: { id: editorRole.id, name: RoleName.SupplierEditor },
          roles,
        },
      }));
    });

    afterEach(async () => {
      const connection = await getOrCreateConnection();
      await connection.getRepository(EmissionAllocationEntity).delete({});
      await connection.getRepository(CorporateEmissionEntity).delete({});
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        beforeEach(async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(
            RoleName.SupplierEditor
          );
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: {
                  id: companyMock.id,
                  status: companyStatus,
                },
                roles,
              }),
            })
          );
        });

        describe('when user represents a supplier', () => {
          describe('when SUPPLIER_EDITOR is deleting allocation that has been adding to customer scope 3', () => {
            it('should delete and update customer scope 3', async () => {
              const connection = await getOrCreateConnection();
              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentByMe,
                customerEmissionId: actualMock.id,
                supplierEmissionId: null,
                status: EmissionAllocationStatus.Approved,
                addedToCustomerScopeTotal: true,
              });

              const server = getApolloServer();
              const result = await server.executeOperation({
                query: deleteEmissionAllocationMutation,
                variables: {
                  input: { id: emissionAllocationSentByMe.id },
                },
              });

              expect(result.data?.deleteEmissionAllocation).toBe(
                emissionAllocationSentByMe.id.toUpperCase()
              );

              const emission = await connection
                .getRepository(CorporateEmissionEntity)
                .findOne({ where: { id: actualMock.id } });

              expect(emission?.scope3).toBe(
                actualMock.scope3 - emissionAllocationSentByMe.emissions
              );

              const allocation = await connection
                .getRepository(EmissionAllocationEntity)
                .findOne({ where: { id: emissionAllocationSentByMe.id } });
              expect(allocation).toBeUndefined();
            });
          });

          describe('when SUPPLIER_EDITOR is deleting allocation that has been included in customer scope 3', () => {
            it('should delete without updating customer scope 3', async () => {
              const connection = await getOrCreateConnection();
              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationSentByMe,
                customerEmissionId: actualMock.id,
                supplierEmissionId: null,
                status: EmissionAllocationStatus.Approved,
                addedToCustomerScopeTotal: false,
              });

              const server = getApolloServer();
              const result = await server.executeOperation({
                query: deleteEmissionAllocationMutation,
                variables: {
                  input: { id: emissionAllocationSentByMe.id },
                },
              });

              expect(result.data?.deleteEmissionAllocation).toBe(
                emissionAllocationSentByMe.id
              );

              const emission = await connection
                .getRepository(CorporateEmissionEntity)
                .findOne({ where: { id: actualMock.id } });

              expect(emission?.scope3).toBe(actualMock.scope3);

              const allocation = await connection
                .getRepository(EmissionAllocationEntity)
                .findOne({ where: { id: emissionAllocationSentByMe.id } });
              expect(allocation).toBeUndefined();
            });
          });

          it.each`
            role
            ${RoleName.SupplierViewer}
          `(
            'should throw an error if "$role" tries to delete an allocation',
            async ({
              role,
            }: {
              role: RoleName;
              companyRelationship?: CompanyRelationshipType;
            }) => {
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
                    userOverrides: { companyId: companyMock.id },
                    companyOverrides: {
                      id: companyMock.id,
                      status: companyStatus,
                    },
                    roles,
                  }),
                })
              );

              const server = getApolloServer();

              const result = await server.executeOperation({
                query: deleteEmissionAllocationMutation,
                variables: {
                  input: {
                    id: emissionAllocationSentByMe.id,
                  },
                },
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

        describe('when user represents a customer', () => {
          describe('when allocation status is REQUEST_DISMISSED', () => {
            it('should allow SUPPLIER_EDITOR to delete the allocation', async () => {
              const connection = await getOrCreateConnection();
              await connection.getRepository(EmissionAllocationEntity).save({
                ...emissionAllocationRequestedByMe,
                customerEmissionId: actualMock.id,
                supplierEmissionId: null,
                status: EmissionAllocationStatus.RequestDismissed,
                addedToCustomerScopeTotal: true,
              });

              const server = getApolloServer();
              const result = await server.executeOperation({
                query: deleteEmissionAllocationMutation,
                variables: {
                  input: { id: emissionAllocationRequestedByMe.id },
                },
              });

              expect(result.data?.deleteEmissionAllocation).toBe(
                emissionAllocationRequestedByMe.id.toUpperCase()
              );

              const allocation = await connection
                .getRepository(EmissionAllocationEntity)
                .findOne({
                  where: { id: emissionAllocationRequestedByMe.id },
                });
              expect(allocation).toBeUndefined();
            });

            it.each`
              role
              ${RoleName.SupplierViewer}
            `(
              'should throw an error if "$role" tries to delete an allocation',
              async ({
                role,
              }: {
                role: RoleName;
                companyRelationship?: CompanyRelationshipType;
              }) => {
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
                      userOverrides: { companyId: companyMock.id },
                      companyOverrides: {
                        id: companyMock.id,
                        status: companyStatus,
                      },
                      roles,
                    }),
                  })
                );

                const server = getApolloServer();

                const result = await server.executeOperation({
                  query: deleteEmissionAllocationMutation,
                  variables: {
                    input: {
                      id: emissionAllocationRequestedByMe.id,
                    },
                  },
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
        describe('when deleting an allocation', () => {
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
                  userOverrides: { companyId: companyMock.id },
                  companyOverrides: {
                    id: companyMock.id,
                    status: companyStatus,
                  },
                  roles,
                }),
              })
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: deleteEmissionAllocationMutation,
              variables: {
                input: {
                  id: emissionAllocationSentByMe.id,
                },
              },
            });

            expect(result.data?.deleteEmissionAllocation).toBeUndefined();

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
