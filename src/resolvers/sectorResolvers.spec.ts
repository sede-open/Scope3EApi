import * as uuid from 'uuid';
import { In, Repository } from 'typeorm';

import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { getOrCreateConnection } from '../dbConnection';
import { SectorEntity } from '../entities/Sector';
import { getCurrentUser } from '../mocks/user';
import { CompanyStatus, RoleName } from '../types';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import { createSectorMock } from '../mocks/sector';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('../auth');

describe('sectorResolvers', () => {
  const OLD_ENV = process.env;
  const authenticateUserMock = (authenticateUser as unknown) as jest.Mock;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    process.env.ENVIRONMENT = 'staging';
    authenticateUserMock.mockRestore();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('sectors', () => {
    const sector1Id = uuid.v4().toUpperCase();
    const sector1Name = 'Something Something';
    const alphabeticallyFirstSectorId = uuid.v4().toUpperCase();
    const alphabeticallyFirstSectorName = 'Aaaaaaaaaaan industry';

    let totalSectorsCount: number;
    let sectorsRepository: Repository<SectorEntity>;

    beforeAll(async () => {
      const connection = await getOrCreateConnection();
      sectorsRepository = await connection.getRepository(SectorEntity);
      totalSectorsCount = await sectorsRepository.count();
    });

    beforeEach(async () => {
      await sectorsRepository.delete({
        name: In([sector1Name, alphabeticallyFirstSectorName]),
      });
    });

    afterAll(async () => {
      await sectorsRepository.delete({
        name: In([sector1Name, alphabeticallyFirstSectorName]),
      });
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
          'should return all sectors for a "$role" of company',
          async ({ role }: { role: RoleName }) => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              role
            );
            authenticateUserMock.mockImplementation(() => ({
              user: getCurrentUser({
                companyOverrides: {
                  status: companyStatus,
                },
                roles,
              }),
            }));

            const dbSectors = await sectorsRepository.find();

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: `
                query {
                  sectors {
                    id
                    name
                  }
                }
              `,
            });

            expect(result.data?.sectors).toHaveLength(dbSectors?.length ?? 0);
            expect(result.errors).toBeUndefined();
          }
        );
      }
    );
    describe('searching sectors', () => {
      const mocks = [
        createSectorMock({
          id: sector1Id,
          name: sector1Name,
          industryCode: '173',
          industryType: 'US Standard Industry Code 1987 - 3 digit',
        }),
      ];

      beforeEach(async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );

        authenticateUserMock.mockImplementation(() => ({
          user: getCurrentUser({
            companyOverrides: {
              status: CompanyStatus.Active,
            },
            roles,
          }),
        }));

        await sectorsRepository.save(mocks);
      });

      it('should pattern match when given a search term (case insensitive)', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
            query($searchTerm: SafeString) {
              sectors(searchTerm: $searchTerm) {
                id
                name
              }
            }
          `,
          variables: {
            searchTerm: 'something',
          },
        });

        expect(result.data?.sectors).toHaveLength(1);
        expect(result.data?.sectors[0]).toEqual(
          expect.objectContaining({
            id: sector1Id,
            name: 'Something Something',
          })
        );
      });
    });

    describe('paginating sectors', () => {
      const mocks = [
        createSectorMock({
          id: alphabeticallyFirstSectorId,
          name: alphabeticallyFirstSectorName,
          industryCode: '173',
          industryType: 'US Standard Industry Code 1987 - 3 digit',
        }),
      ];

      beforeEach(async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        authenticateUserMock.mockImplementation(() => ({
          user: getCurrentUser({
            companyOverrides: {
              status: CompanyStatus.Active,
            },
            roles,
          }),
        }));

        await sectorsRepository.save(mocks);
      });

      it('should return the full dataset when pageNumber but no pageSize', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
            query($searchTerm: SafeString, $pageNumber: Int, $pageSize: PageSize) {
              sectors(searchTerm: $searchTerm, pageNumber: $pageNumber, pageSize: $pageSize) {
                id
                name
              }
            }
          `,
          variables: {
            pageNumber: 1,
          },
        });

        expect(result.data?.sectors).toHaveLength(
          totalSectorsCount + mocks.length
        );
      });

      it('should return the full dataset when pageSize but no pageNumber', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
            query($searchTerm: SafeString, $pageNumber: Int, $pageSize: PageSize) {
              sectors(searchTerm: $searchTerm, pageNumber: $pageNumber, pageSize: $pageSize) {
                id
                name
              }
            }
          `,
          variables: {
            pageSize: 1,
          },
        });

        expect(result.data?.sectors).toHaveLength(
          totalSectorsCount + mocks.length
        );
      });

      it('should return the full dataset when pageNumber 0 requested', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
            query($searchTerm: SafeString, $pageNumber: Int, $pageSize: PageSize) {
              sectors(searchTerm: $searchTerm, pageNumber: $pageNumber, pageSize: $pageSize) {
                id
                name
              }
            }
          `,
          variables: {
            pageSize: 50,
            pageNumber: 0,
          },
        });

        expect(result.data?.sectors).toHaveLength(
          totalSectorsCount + mocks.length
        );
      });

      it('should page records when given correct pagination parameters', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
            query($searchTerm: SafeString, $pageNumber: Int, $pageSize: PageSize) {
              sectors(searchTerm: $searchTerm, pageNumber: $pageNumber, pageSize: $pageSize) {
                id
                name
              }
            }
          `,
          variables: {
            pageSize: 10,
            pageNumber: 1,
          },
        });

        expect(result.data?.sectors).toHaveLength(10);
        expect(result.data?.sectors[0]).toEqual(
          expect.objectContaining({
            name: alphabeticallyFirstSectorName,
          })
        );
      });
    });
  });

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
        'should throw an error for a "$role" of company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);

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
                sectors {
                  id
                }
              }
            `,
          });

          expect(result.data?.sectors).toBeUndefined();

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
