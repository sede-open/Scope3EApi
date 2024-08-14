import { getApolloServer } from '../apollo';

import { authenticateUser } from '../auth';
import { RoleName, CompanySectorType, CompanyStatus } from '../types';
import { In } from 'typeorm';

import { getOrCreateConnection } from '../dbConnection';
import { companySector2Mock, companySectorMock } from '../mocks/companySector';
import { sectorMock, sector2Mock } from '../mocks/sector';
import { CompanySectorEntity } from '../entities/CompanySector';
import { getCurrentUser, supplierEditorUserMock } from '../mocks/user';
import { SectorEntity } from '../entities/Sector';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('../auth');
jest.mock('../jobs/tasks/email/queue');

describe('companySectorResolvers', () => {
  const OLD_ENV = process.env;

  afterAll(() => {
    process.env = OLD_ENV;
  });

  beforeEach(async () => {
    process.env = { ...OLD_ENV };
    process.env.ENVIRONMENT = 'staging';

    const connection = await getOrCreateConnection();
    await connection
      .getRepository(SectorEntity)
      .save([sectorMock, sector2Mock]);
    await connection.getRepository(CompanySectorEntity).save(companySectorMock);
  });

  afterEach(async () => {
    const connection = await getOrCreateConnection();
    if (connection) {
      await connection?.getRepository(CompanySectorEntity).delete({});
      await connection?.getRepository(SectorEntity).delete({
        id: In([sectorMock.id, sector2Mock.id]),
      });
    }
  });

  describe('companySectors', () => {
    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should return all company SBTI sectors for a company', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
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
            query: `
                  query (
                    $companyId: UUID!,
                  ) {
                    companySectors(
                      companyId: $companyId,
                    ) {
                      company {
                        id
                      }
                      sector {
                        name
                      }
                    }
                  }
                `,
            variables: {
              companyId: supplierEditorUserMock.companyId,
            },
          });

          expect(result.errors).toBeUndefined();

          expect(result.data?.companySectors).toEqual([
            expect.objectContaining({
              company: {
                id: companySectorMock.companyId,
              },
              sector: {
                name: sectorMock.name,
              },
            }),
          ]);
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
        it('should throw an error when querying companySectors', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
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
            query: `
                  query (
                    $companyId: UUID!,
                  ) {
                    companySectors(
                      companyId: $companyId,
                    ) {
                      sector {
                        name
                      }
                    }
                  }
                `,
            variables: {
              companyId: supplierEditorUserMock.companyId,
            },
          });

          expect(result.data?.companySectors).toBeUndefined();

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

  describe('updateCompanySectors', () => {
    const updateCompanySectorsMutations = `
      mutation ($input: UpdateCompanySectorsInput!) {
        updateCompanySectors(input: $input) {
          company {
            id
          }
          sector {
            name
          }
        }
      }
    `;

    const updateInput = {
      companyId: supplierEditorUserMock.companyId,
      sectors: [
        {
          id: companySector2Mock.sectorId,
          sectorType: CompanySectorType.Primary,
        },
      ],
    };

    const OLD_ENV = process.env;

    afterAll(() => {
      process.env = OLD_ENV;
    });

    beforeEach(async () => {
      process.env = { ...OLD_ENV };
      process.env.ENVIRONMENT = 'staging';
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should allow a SUPPLIER_EDITOR to update company SBTI sectors', async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
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
            query: updateCompanySectorsMutations,
            variables: {
              input: updateInput,
            },
          });

          expect(result.errors).toBeUndefined();

          expect(result.data?.updateCompanySectors).toEqual([
            {
              company: {
                id: companySector2Mock.companyId,
              },
              sector: {
                name: sector2Mock.name,
              },
            },
          ]);
        });

        it.each`
          role
          ${RoleName.SupplierViewer}
        `(
          'should throw an error if "$role" tries to update company SBTI sectors ',
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
              query: updateCompanySectorsMutations,
              variables: {
                input: updateInput,
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
        describe('when updating company sectors', () => {
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
              query: updateCompanySectorsMutations,
              variables: {
                input: updateInput,
              },
            });

            expect(result.data?.updateCompanySectors).toBeUndefined();

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
