import fetch from 'node-fetch';
import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { COMPANY_EXISTS_FAIL } from '../controllers/CompanyRelationshipController';
import { getOrCreateConnection } from '../dbConnection';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { getInviteToJoinTemplate } from '../emailTemplates/inviteToJoin';
import { CarbonIntensityEntity } from '../entities/CarbonIntensity';
import { CompanyEntity } from '../entities/Company';
import { CompanyRelationshipEntity } from '../entities/CompanyRelationship';
import { CompanySectorEntity } from '../entities/CompanySector';
import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import { TargetEntity } from '../entities/Target';
import { UserEntity } from '../entities/User';
import { addJobSendEmailToQueue } from '../jobs/tasks/email/queue';
import { company2Mock, companyMock } from '../mocks/company';
import {
  companyCustomerMock,
  companySupplierMock,
} from '../mocks/companyRelationship';
import { getDnBCompanyByDunsResult } from '../mocks/dnbCompanyByDUNSResult';
import { getCurrentUser, supplierEditorUserMock } from '../mocks/user';
import { CorporateEmissionRepository } from '../repositories/CorporateEmissionRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { TargetRepository } from '../repositories/TargetRepository';
import { DatabaseService } from '../services/DatabaseService/DatabaseService';
import {
  AmbitionPrivacyStatus,
  CarbonIntensityMetricType,
  CompanyRelationshipType,
  CompanySectorType,
  CompanyStatus,
  CorporateEmissionType,
  EmissionPrivacyStatus,
  InviteStatus,
  RoleName,
  Scope2Type,
  TargetPrivacyType,
  TargetStrategyType,
  UserStatus,
} from '../types';

jest.mock('node-fetch');
jest.mock('../auth');
jest.mock('../jobs/tasks/email/queue');
jest.mock('../emailTemplates/inviteToJoin');

describe('companyRelationshipResolvers', () => {
  process.env.JWT_ISSUER = 'localhost:4000';
  process.env.INVITE_JWT_SECRET = 'iamsecret';
  process.env.WEB_APP_BASE_URL = 'localhost:3000';

  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    process.env.ENVIRONMENT = 'staging';

    jest.clearAllMocks();
    ((addJobSendEmailToQueue as unknown) as jest.Mock).mockImplementation(
      () => undefined
    );
    ((getInviteToJoinTemplate as unknown) as jest.Mock).mockImplementation(
      () => ({ template: '', subject: '' })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('companyRelationships', () => {
    const companyRelationshipsQuery = `
      query (
        $companyId: UUID!,
        $relationshipType: CompanyRelationshipType,
        $status: InviteStatus
      ) {
        companyRelationships(
          companyId: $companyId,
          relationshipType: $relationshipType,
          status: $status
        ) {
          id
          status
          inviteType
          supplier {
            id
            name
          }
          customer {
            id
            name
          }
          customerApprover {
            id
          }
          supplierApprover {
            id
          }
          note
          createdAt
        }
      }
    `;

    const companyRelationshipWithSharedDataQuery = `
      query (
        $companyId: UUID!,
        $relationshipType: CompanyRelationshipType,
        $status: InviteStatus
      ) {
        companyRelationships(
          companyId: $companyId,
          relationshipType: $relationshipType,
          status: $status
        ) {
          id
          status
          inviteType
          supplier {
            id
            name
          }
          customer {
            id
            name
          }
          emissionPrivacyStatus
          ambitionPrivacyStatus
          supplierApprover {
            firstName
            lastName
            email
          }
          customerApprover {
            firstName
            lastName
            email
          }
          note
          createdAt
        }
      }
    `;

    beforeAll(async () => {
      const connection = await getOrCreateConnection();
      await connection
        .getRepository(CompanyRelationshipEntity)
        .save(companySupplierMock);
      await connection
        .getRepository(CompanyRelationshipEntity)
        .save(companyCustomerMock);
      const databaseService = new DatabaseService();
      const emissionRepo = await databaseService.getRepository(
        CorporateEmissionRepository
      );
      const emission = await emissionRepo.createEntity({
        companyId: companySupplierMock.supplierId.toUpperCase(),
        createdBy: supplierEditorUserMock.id,
        type: CorporateEmissionType.Actual,
        year: 2022,
        scope1: 123,
        scope2: 123,
        scope2Type: Scope2Type.Location,
      });

      const targetRepo = await databaseService.getRepository(TargetRepository);
      await targetRepo.createAbsoluteTargetScope1And2({
        companyId: companySupplierMock.supplierId.toUpperCase(),
        year: 2020,
        createdBy: supplierEditorUserMock.id,
        strategy: TargetStrategyType.Aggressive,
        reduction: 40,
        includeCarbonOffset: false,
        privacyType: TargetPrivacyType.Private,
      });

      const carbonIntensity = new CarbonIntensityEntity();

      carbonIntensity.companyId = companySupplierMock.supplierId.toUpperCase();
      carbonIntensity.year = 2020;
      carbonIntensity.createdBy = supplierEditorUserMock.id;
      carbonIntensity.intensityMetric =
        CarbonIntensityMetricType.BusinessTravelPerPassengerKm;
      carbonIntensity.intensityValue = 0;
      carbonIntensity.emissionId = emission.id;

      await carbonIntensity.save();
      await targetRepo.createIntensityTargetScope1And2(
        {
          companyId: companySupplierMock.supplierId.toUpperCase(),
          year: 2020,
          createdBy: supplierEditorUserMock.id,
          strategy: TargetStrategyType.Aggressive,
          reduction: 40,
          includeCarbonOffset: false,
          privacyType: TargetPrivacyType.ScienceBasedInitiative,
        },
        [carbonIntensity]
      );
    });

    afterAll(async () => {
      const connection = await getOrCreateConnection();
      const carbonIntensities = await connection
        .getRepository(CarbonIntensityEntity)
        .find();
      for (let i = 0; i < carbonIntensities.length; i++) {
        const ci = carbonIntensities[i];
        ci.targets = [];
        await ci.save();
      }
      await connection.getRepository(CarbonIntensityEntity).delete({});
      await connection.getRepository(CorporateEmissionEntity).delete({});
      await connection.getRepository(TargetEntity).delete({});
      await connection.getRepository(CompanyRelationshipEntity).delete({});
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
          'should return all company relationships for a $role',
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
              query: `
              query (
                $companyId: UUID!,
                $relationshipType: CompanyRelationshipType,
                $status: InviteStatus
              ) {
                companyRelationships(
                  companyId: $companyId,
                  relationshipType: $relationshipType,
                  status: $status
                ) {
                  id
                  supplier {
                    id
                    name
                  }
                  customer {
                    id
                    name
                  }
                  createdAt
                }
              }
            `,
              variables: { companyId: companyMock.id },
            });

            expect(result.data?.companyRelationships).toHaveLength(2);
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.Admin}
        `(
          'should include note and createdAt values when queried',
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
              query: `
              query (
                $companyId: UUID!,
                $relationshipType: CompanyRelationshipType,
                $status: InviteStatus
              ) {
                companyRelationships(
                  companyId: $companyId,
                  relationshipType: $relationshipType,
                  status: $status
                ) {
                  id
                  supplier {
                    id
                    name
                  }
                  customer {
                    id
                    name
                  }
                  createdAt
                  note
                }
              }
            `,
              variables: { companyId: companyMock.id },
            });

            expect(result.data?.companyRelationships).toHaveLength(2);
            expect(result.data?.companyRelationships?.[0]?.createdAt).toEqual(
              companyCustomerMock.createdAt
            );
            expect(result.data?.companyRelationships?.[0]?.note).toEqual(
              companyCustomerMock.note
            );
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
          ${RoleName.Admin}
        `(
          'should return all customers for a $role',
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
              query: companyRelationshipsQuery,
              variables: {
                companyId: companyMock.id,
                relationshipType: CompanyRelationshipType.Customer,
              },
            });

            expect(result.data?.companyRelationships).toHaveLength(1);
            expect(result.data?.companyRelationships?.[0]?.supplier.id).toBe(
              companyMock.id
            );
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
          ${RoleName.Admin}
        `(
          'should return all suppliers for a $role',
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
              query: companyRelationshipsQuery,
              variables: {
                companyId: companyMock.id,
                relationshipType: CompanyRelationshipType.Supplier,
              },
            });

            expect(result.data?.companyRelationships).toHaveLength(1);
            expect(result.data?.companyRelationships[0]?.customer.id).toBe(
              companyMock.id
            );
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
          ${RoleName.Admin}
        `(
          'should return all company relationships by status for a $role',
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
              query: companyRelationshipsQuery,
              variables: {
                companyId: companyMock.id,
                status: InviteStatus.Approved,
              },
            });

            expect(result.data?.companyRelationships).toHaveLength(1);
            expect(result.data?.companyRelationships[0]?.status).toBe(
              InviteStatus.Approved
            );
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
          ${RoleName.Admin}
        `(
          'should return all suppliers by status for a $role',
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
              query: companyRelationshipsQuery,
              variables: {
                companyId: companyMock.id,
                relationshipType: CompanyRelationshipType.Supplier,
                status: InviteStatus.Approved,
              },
            });

            expect(result.data?.companyRelationships).toHaveLength(1);
            expect(result.data?.companyRelationships[0]?.status).toBe(
              InviteStatus.Approved
            );
            expect(result.errors).toBeUndefined();
          }
        );

        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
          ${RoleName.Admin}
        `(
          'should return all customers by status for a $role',
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
              query: companyRelationshipsQuery,
              variables: {
                companyId: companyMock.id,
                relationshipType: CompanyRelationshipType.Customer,
                status: InviteStatus.AwaitingCustomerApproval,
              },
            });

            expect(result.data?.companyRelationships).toHaveLength(1);
            expect(result.data?.companyRelationships[0]?.status).toBe(
              InviteStatus.AwaitingCustomerApproval
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
          'should return all company relationships for a $role',
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
              query: companyRelationshipsQuery,
              variables: { companyId: companyMock.id },
            });

            expect(result.data?.companyRelationships).toBeUndefined();

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

    describe('when retrieving shared data', () => {
      beforeEach(async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            userOverrides: { companyId: companyMock.id },
            companyOverrides: {
              id: companyMock.id,
            },
            roles,
          }),
        }));
      });
      it('should return emissionPrivacyStatus', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: companyRelationshipWithSharedDataQuery,
          variables: { companyId: companyMock.id },
        });
        const companyRelationships = result.data?.companyRelationships;
        expect(companyRelationships[1].emissionPrivacyStatus).toEqual(
          EmissionPrivacyStatus.Shared
        );
      });

      it('should return ambitionPrivacyStatus', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: companyRelationshipWithSharedDataQuery,
          variables: { companyId: companyMock.id },
        });
        const companyRelationships = result.data?.companyRelationships;
        expect(companyRelationships[1].ambitionPrivacyStatus).toEqual(
          AmbitionPrivacyStatus.SharedSbti
        );
      });
    });
  });

  describe('createCompanyRelationship', () => {
    const createCompanyRelationshipMutation = `
      mutation ($input: CreateCompanyRelationshipInput!) {
        createCompanyRelationship(input: $input) {
          inviteType
          status
          note
          customer {
            id
          }
          supplier {
            id
          }
          supplierApprover {
            id
          }
          customerApprover {
            id
          }
        }
      }
    `;

    afterEach(async () => {
      const connection = await getOrCreateConnection();
      if (connection) {
        await connection?.getRepository(CompanyRelationshipEntity).delete({});
      }
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
          ${RoleName.Admin}
          ${RoleName.SupplierEditor}
        `(
          'should allow a $role to create a new customer relationship',
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
              query: createCompanyRelationshipMutation,
              variables: {
                input: {
                  inviteType: companyCustomerMock.inviteType,
                  customerId: companyCustomerMock.customerId.toUpperCase(),
                  supplierId: companyCustomerMock.supplierId.toUpperCase(),
                  note: companyCustomerMock.note,
                },
              },
            });

            expect(result.data?.createCompanyRelationship).toEqual(
              expect.objectContaining({
                inviteType: companyCustomerMock.inviteType,
                status: InviteStatus.AwaitingCustomerApproval,
                customer: expect.objectContaining({
                  id: companyCustomerMock.customerId.toUpperCase(),
                }),
                supplier: { id: companyCustomerMock.supplierId.toUpperCase() },
                note: companyCustomerMock.note,
                supplierApprover: {
                  id: supplierEditorUserMock.id.toUpperCase(),
                },
                customerApprover: null,
              })
            );
          }
        );

        it.each`
          role
          ${RoleName.SupplierViewer}
        `(
          'should throw an error if "$role" tries to create a relationship ',
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
              query: createCompanyRelationshipMutation,
              variables: {
                input: {
                  inviteType: companySupplierMock.inviteType,
                  customerId: companySupplierMock.customerId,
                  supplierId: companySupplierMock.supplierId,
                  note: companySupplierMock.note,
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
        it('should NOT allow a SUPPLIER_EDITOR to create a new customer relationship', async () => {
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

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: createCompanyRelationshipMutation,
            variables: {
              input: {
                inviteType: companyCustomerMock.inviteType,
                customerId: companyCustomerMock.customerId.toUpperCase(),
                supplierId: companyCustomerMock.supplierId.toUpperCase(),
                note: companyCustomerMock.note,
              },
            },
          });

          expect(result.data?.createCompanyRelationship).toBeUndefined();

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

  describe('updateCompanyRelationship', () => {
    const updateCompanyRelationshipMutation = `
      mutation ($input: UpdateCompanyRelationshipInput!) {
        updateCompanyRelationship(input: $input) {
          inviteType
          status
          note
          customer {
            id
          }
          supplier {
            id
          }
          supplierApprover {
            id
          }
          customerApprover {
            id
          }
        }
      }
    `;

    const relationship = {
      ...companyCustomerMock,
      status: InviteStatus.RejectedByCustomer,
      supplierId: companyMock.id,
    };

    const updateCompanyRelationshipInput = {
      id: relationship.id,
      status: InviteStatus.AwaitingCustomerApproval,
      note: companyCustomerMock.note,
    };

    beforeEach(async () => {
      const connection = await getOrCreateConnection();
      await connection
        ?.getRepository(CompanyRelationshipEntity)
        .save(relationship);
    });

    afterEach(async () => {
      const connection = await getOrCreateConnection();
      if (connection) {
        await connection?.getRepository(CompanyRelationshipEntity).delete({});
      }
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should allow a SUPPLIER_EDITOR to update an invite', async () => {
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

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: updateCompanyRelationshipMutation,
            variables: {
              input: updateCompanyRelationshipInput,
            },
          });

          expect(result.data?.updateCompanyRelationship).toEqual(
            expect.objectContaining({
              status: InviteStatus.AwaitingCustomerApproval,
              note: updateCompanyRelationshipInput.note,
            })
          );
        });

        it.each`
          role
          ${RoleName.SupplierViewer}
        `(
          'should throw an error if "$role" tries to update a relationship ',
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
              query: updateCompanyRelationshipMutation,
              variables: {
                input: updateCompanyRelationshipInput,
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
        it('should NOT allow a SUPPLIER_EDITOR to update an invite', async () => {
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

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: updateCompanyRelationshipMutation,
            variables: {
              input: updateCompanyRelationshipInput,
            },
          });

          expect(result.data?.updateCompanyRelationship).toBeUndefined();

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

  describe('inviteAndConnectToCompany', () => {
    const inviteAndConnectToCompanyMutation = `
      mutation ($input: InviteAndConnectToCompanyInput!) {
        inviteAndConnectToCompany(input: $input) {
          inviteType
          status
          note
          customer {
            name
          }
          supplier {
            id
          }
          supplierApprover {
            id
          }
          customerApprover {
            id
          }
        }
      }
    `;

    const newCompanyDuns = '804735132';
    const newUser = {
      firstName: 'Some',
      lastName: 'Name',
      email: 'new.user@test.com',
    };

    const customerInviteInput = {
      inviteType: companyCustomerMock.inviteType,
      note: companyCustomerMock.note,
      companyDuns: newCompanyDuns,
      ...newUser,
    };

    const invitationDeclinedCompanyMock = {
      ...companyMock,
      id: 'f2bc6f3a-dc4b-4a40-a2ec-6ed1cdd0fcfb',
      duns: newCompanyDuns,
      status: CompanyStatus.InvitationDeclined,
    };

    afterEach(async () => {
      const connection = await getOrCreateConnection();
      if (connection) {
        const company = await connection?.getRepository(CompanyEntity).findOne({
          duns: newCompanyDuns,
        });

        await connection?.getRepository(CompanyRelationshipEntity).delete({
          customerId: company?.id,
        });
        await connection?.getRepository(CompanyRelationshipEntity).delete({
          supplierId: company?.id,
        });
        const companyUsers = await connection.getRepository(UserEntity).find({
          where: {
            companyId: company?.id,
          },
          relations: ['roles'],
        });

        await Promise.all(
          companyUsers.map(async (user) => {
            user.roles = [];
            await user.save();
          })
        );

        await connection?.getRepository(UserEntity).delete({
          companyId: company?.id,
        });

        await connection?.getRepository(CompanyEntity).delete({
          duns: newCompanyDuns,
        });
      }
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        describe('when inviting a new company as customer', () => {
          describe('when user is a SUPPLIER_EDITOR', () => {
            const currentUser = getCurrentUser({
              userOverrides: { companyId: companyMock.id },
              companyOverrides: {
                id: companyMock.id,
                status: companyStatus,
              },
            });

            beforeEach(async () => {
              const connection = await getOrCreateConnection();
              const roleRepository = connection.getCustomRepository(
                RoleRepository
              );
              const roles = await roleRepository.findAssumedRolesForRoleName(
                RoleName.SupplierEditor
              );
              ((authenticateUser as unknown) as jest.Mock).mockImplementation(
                () => ({ user: { ...currentUser, roles } })
              );
            });

            it('should create a relationship between current user company and invited company', async () => {
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

              const dnbCompanyProfileMock = getDnBCompanyByDunsResult(
                newCompanyDuns
              );

              ((fetch as unknown) as jest.Mock).mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(dnbCompanyProfileMock),
              });

              const server = getApolloServer();

              const result = await server.executeOperation({
                query: inviteAndConnectToCompanyMutation,
                variables: {
                  input: customerInviteInput,
                },
              });

              expect(result.data?.inviteAndConnectToCompany).toEqual(
                expect.objectContaining({
                  inviteType: CompanyRelationshipType.Customer,
                  status: InviteStatus.AwaitingCustomerApproval,
                  customer: expect.objectContaining({
                    name: dnbCompanyProfileMock.organization.primaryName,
                  }),
                  supplier: {
                    id: supplierEditorUserMock.companyId.toUpperCase(),
                  },
                  note: customerInviteInput.note,
                  supplierApprover: {
                    id: supplierEditorUserMock.id.toUpperCase(),
                  },
                  customerApprover: null,
                })
              );

              const createdCompany = await connection
                ?.getRepository(CompanyEntity)
                .findOne({
                  duns: newCompanyDuns,
                });

              expect(createdCompany).toEqual(
                expect.objectContaining({
                  duns: dnbCompanyProfileMock.organization.duns,
                  dnbCountry:
                    dnbCompanyProfileMock.organization.primaryAddress
                      .addressCountry.name,
                  dnbCountryIso:
                    dnbCompanyProfileMock.organization.primaryAddress
                      .addressCountry.isoAlpha2Code,
                  dnbRegion:
                    dnbCompanyProfileMock.organization.primaryAddress
                      .addressRegion.name,
                  dnbPostalCode:
                    dnbCompanyProfileMock.organization.primaryAddress
                      .postalCode,
                  dnbAddressLineOne:
                    dnbCompanyProfileMock.organization.primaryAddress
                      .streetAddress.line1,
                  dnbAddressLineTwo:
                    dnbCompanyProfileMock.organization.primaryAddress
                      .streetAddress.line2,
                  status: CompanyStatus.PendingUserConfirmation,
                  createdBy: supplierEditorUserMock.id.toUpperCase(),
                })
              );

              const createdUser = await connection
                ?.getRepository(UserEntity)
                .findOne({
                  email: customerInviteInput.email,
                });

              expect(createdUser).toEqual(
                expect.objectContaining({
                  companyId: createdCompany?.id,
                  firstName: customerInviteInput.firstName,
                  lastName: customerInviteInput.lastName,
                  email: customerInviteInput.email,
                  status: UserStatus.Pending,
                })
              );

              const companySectors = await connection
                ?.getRepository(CompanySectorEntity)
                .find({
                  companyId: createdCompany?.id,
                });

              expect(companySectors).toHaveLength(2);
              expect(companySectors).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    sectorType: CompanySectorType.Primary,
                  }),
                  expect.objectContaining({
                    sectorType: CompanySectorType.Secondary,
                  }),
                ])
              );
            });

            it('should send an invite to join email to the invitee', async () => {
              const dnbCompanyProfileMock = getDnBCompanyByDunsResult(
                newCompanyDuns
              );

              ((fetch as unknown) as jest.Mock).mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(dnbCompanyProfileMock),
              });

              const server = getApolloServer();

              await server.executeOperation({
                query: inviteAndConnectToCompanyMutation,
                variables: {
                  input: customerInviteInput,
                },
              });

              expect(getInviteToJoinTemplate).toHaveBeenCalledTimes(1);
              expect(getInviteToJoinTemplate).toHaveBeenCalledWith(
                expect.objectContaining({
                  inviteeName: customerInviteInput.firstName,
                  inviterName: `${currentUser.firstName} ${currentUser.lastName}`,
                  inviterCompanyName: currentUser.company.name,
                  inviteLink: expect.any(String),
                })
              );

              expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
              expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                  recipient: customerInviteInput.email,
                })
              );
            });
          });

          describe.each`
            role
            ${RoleName.SupplierViewer}
          `('when user is a $role', ({ role }: { role: RoleName }) => {
            it('should throw an error', async () => {
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
                query: inviteAndConnectToCompanyMutation,
                variables: {
                  input: customerInviteInput,
                },
              });

              expect(result.data?.inviteAndConnectToCompany).toBeUndefined();
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

        describe('when inviting an existing company as customer', () => {
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

          describe('when invited company has a status of INVITATION_DECLINED', () => {
            it('should update the existing company and create relationship between current user company and invited company', async () => {
              const connection = await getOrCreateConnection();

              const invitationDeclinedCompany = await connection
                ?.getRepository(CompanyEntity)
                .save(invitationDeclinedCompanyMock);

              const server = getApolloServer();

              const result = await server.executeOperation({
                query: inviteAndConnectToCompanyMutation,
                variables: {
                  input: customerInviteInput,
                },
              });

              expect(result.data?.inviteAndConnectToCompany).toEqual(
                expect.objectContaining({
                  inviteType: CompanyRelationshipType.Customer,
                  status: InviteStatus.AwaitingCustomerApproval,
                  customer: expect.objectContaining({
                    name: invitationDeclinedCompany?.name,
                  }),
                  supplier: {
                    id: supplierEditorUserMock.companyId.toUpperCase(),
                  },
                  note: customerInviteInput.note,
                  supplierApprover: {
                    id: supplierEditorUserMock.id.toUpperCase(),
                  },
                  customerApprover: null,
                })
              );

              const updatedCompany = await connection
                ?.getRepository(CompanyEntity)
                .findOne({
                  duns: newCompanyDuns,
                });

              expect(updatedCompany).toEqual(
                expect.objectContaining({
                  status: CompanyStatus.PendingUserConfirmation,
                })
              );

              const createdUser = await connection
                ?.getRepository(UserEntity)
                .findOne({
                  email: customerInviteInput.email,
                });

              expect(createdUser).toEqual(
                expect.objectContaining({
                  companyId: updatedCompany?.id,
                  firstName: customerInviteInput.firstName,
                  lastName: customerInviteInput.lastName,
                  email: customerInviteInput.email,
                  status: UserStatus.Pending,
                })
              );

              expect(addJobSendEmailToQueue).toHaveBeenCalled();
            });
          });

          describe('when the company has an ACTIVE status', () => {
            it('should throw an error', async () => {
              const server = getApolloServer();

              const result = await server.executeOperation({
                query: inviteAndConnectToCompanyMutation,
                variables: {
                  input: {
                    ...customerInviteInput,
                    companyDuns: company2Mock.duns,
                  },
                },
              });

              expect(result.errors).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    message: COMPANY_EXISTS_FAIL,
                  }),
                ])
              );
            });
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
        describe.each`
          env
          ${'local'}
          ${'dev'}
          ${'staging'}
        `(
          'when query is performed in $env environment',
          ({ env }: { env: string }) => {
            const OLD_ENV = process.env;

            afterAll(() => {
              process.env = OLD_ENV;
            });

            beforeEach(async () => {
              process.env = { ...OLD_ENV };
              process.env.ENVIRONMENT = env;
            });

            it('should create a relationship between current user company and invited company', async () => {
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

              const input = {
                inviteType: companyCustomerMock.inviteType,
                note: companyCustomerMock.note,
                companyDuns: newCompanyDuns,
                ...newUser,
              };

              const result = await server.executeOperation({
                query: inviteAndConnectToCompanyMutation,
                variables: {
                  input,
                },
              });

              expect(result.data?.inviteAndConnectToCompany).toBeUndefined();

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
      }
    );
  });

  describe('networkSummary', () => {
    const companyId = companyMock.id;
    const networkSummaryQuery = `
      query {
        networkSummary {
          companyId
          numSuppliers
          numCustomers
          numPendingInvitations
        }
      }   
    `;

    it('should return each of the counts', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierViewer
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          roles,
          userOverrides: { companyId },
        }),
      }));

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: networkSummaryQuery,
      });
      expect(result.errors).toBeUndefined();
      expect(result?.data?.networkSummary).toEqual({
        companyId,
        numSuppliers: 0,
        numCustomers: 0,
        numPendingInvitations: 0,
      });
    });
  });
});
