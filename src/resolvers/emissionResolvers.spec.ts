import { GraphQLFormattedError } from 'graphql';
import { Connection, In, Repository } from 'typeorm';
import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { AzureBlobClient } from '../clients/AzureBlobClient';
import { YEAR_EMISSION_EXISTS_ERROR } from '../controllers/CorporateEmissionController';
import {
  getOrCreateConnection,
  getOrCreateDBConnection,
} from '../dbConnection';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives//transformers/belongsToApprovedCompany';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { CarbonIntensityEntity } from '../entities/CarbonIntensity';
import { CompanySectorEntity } from '../entities/CompanySector';
import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import { CorporateEmissionAccessEntity } from '../entities/CorporateEmissionAccess';
import { FileEntity } from '../entities/File';
import { SectorEntity } from '../entities/Sector';
import { createCarbonIntensityMock } from '../mocks/carbonIntensities';
import { company2Mock, company3Mock, companyMock } from '../mocks/company';
import { companySector3Mock, companySectorMock } from '../mocks/companySector';
import {
  actualMock,
  baselineMock,
  emissionAccessMock,
  externalBaselineMock,
} from '../mocks/emission';
import { file2Mock, fileMock } from '../mocks/file';
import { sector2Mock, sectorMock } from '../mocks/sector';
import { createTargetMock } from '../mocks/target';
import { getCurrentUser, supplierEditorUserMock } from '../mocks/user';
import { CarbonIntensityRepository } from '../repositories/CarbonIntensityRepository';
import { CorporateEmissionRepository } from '../repositories/CorporateEmissionRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { TargetRepository } from '../repositories/TargetRepository';
import {
  CarbonIntensityMetricType,
  CompanyStatus,
  CorporateEmission,
  CorporateEmissionType,
  ReductionRankType,
  RoleName,
  Scope2Type,
  TargetScopeType,
  TargetStrategyType,
  TargetType,
  UpdateCorporateEmissionInput,
} from '../types';

jest.mock('../auth');
jest.mock('../clients/AzureBlobClient');

const removeAllEmissionsData = async () => {
  const connection = await getOrCreateConnection();

  await connection.query('DELETE FROM CORPORATE_EMISSION');
};

const removeSectorDataForRanks = async () => {
  const connection = await getOrCreateConnection();

  if (connection) {
    await connection.query('DELETE FROM CORPORATE_EMISSION');
    await connection?.getRepository(SectorEntity).delete({
      id: In([sectorMock.id, sector2Mock.id]),
    });
  }
};

const removeCompanySectorDataForRanks = async () => {
  const connection = await getOrCreateConnection();

  if (connection) {
    await connection.query('DELETE FROM CORPORATE_EMISSION');
    await connection?.getRepository(CompanySectorEntity).delete({
      id: In([companySectorMock.id, companySector3Mock.id]),
    });
  }
};

const currentYear = 2018;
const previousYear = 2017;

const firstCarbonIntensityId = '';
const secondCarbonIntensityId = '';

describe('emissionResolvers - corporateEmissions', () => {
  describe.each`
    companyStatus
    ${CompanyStatus.Active}
    ${CompanyStatus.PendingUserActivation}
  `(
    'when user belongs to a company with $companyStatus status',
    ({ companyStatus }: { companyStatus: CompanyStatus }) => {
      beforeAll(async () => {
        // add target into DB
        const connection = await getOrCreateConnection();
        await connection
          .getRepository(CorporateEmissionEntity)
          .save(baselineMock);
        await connection
          .getRepository(CorporateEmissionEntity)
          .save(actualMock);
        await connection
          .getRepository(CorporateEmissionEntity)
          .save(externalBaselineMock);
      });

      it.each`
        role
        ${RoleName.SupplierEditor}
        ${RoleName.SupplierViewer}
      `(
        'should return corporate emissions for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!, $year: Int) {
                corporateEmissions(companyId: $companyId, year: $year) {
                  id
                  type
                  year
                  scope1
                  scope2
                  scope3
                  scope2Type
                  offset
                  examplePercentage
                  headCount
                  company {
                    id
                  }
                  verificationFile {
                    originalFilename
                  }
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.corporateEmissions).toHaveLength(2);
          expect(result.data?.corporateEmissions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: baselineMock.id,
                verificationFile: expect.objectContaining({
                  originalFilename: fileMock.originalFilename,
                }),
              }),
              expect.objectContaining({ id: actualMock.id }),
            ])
          );
          expect(result.errors).toBeUndefined();
        }
      );

      it.each`
        role
        ${RoleName.SupplierEditor}
        ${RoleName.SupplierViewer}
      `(
        'should return corporate emissions for a "$role" of a company and year',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
            query ($companyId: UUID!, $year: Int) {
              corporateEmissions(companyId: $companyId, year: $year) {
                id
                type
                year
                scope1
                scope2
                scope3
                scope2Type
                offset
                examplePercentage
                headCount
                company {
                  id
                }
              }
            }
          `,
            variables: { companyId: companyMock.id, year: baselineMock.year },
          });

          expect(result.data?.corporateEmissions).toHaveLength(1);
          expect(result.data?.corporateEmissions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ id: baselineMock.id }),
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
        'should throw an error for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!, $year: Int) {
                corporateEmissions(companyId: $companyId, year: $year) {
                  id
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.corporateEmissions).toBeUndefined();

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

  describe('when the user has permissions to query the emissions', () => {
    beforeAll(async () => {
      const connection = await getOrCreateConnection();
      await connection
        .getRepository(CorporateEmissionEntity)
        .save(baselineMock);
      await connection.getRepository(CorporateEmissionEntity).save(actualMock);
      await connection.getRepository(CarbonIntensityEntity).save([
        createCarbonIntensityMock({
          id: firstCarbonIntensityId,
          emissionId: baselineMock.id,
          companyId: baselineMock.companyId,
          createdBy: baselineMock.createdBy,
          updatedBy: baselineMock.updatedBy,
          intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
          intensityValue: 200,
          year: baselineMock.year,
        }),
        createCarbonIntensityMock({
          id: secondCarbonIntensityId,
          emissionId: baselineMock.id,
          companyId: baselineMock.companyId,
          createdBy: baselineMock.createdBy,
          updatedBy: baselineMock.updatedBy,
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityValue: 200000,
          year: baselineMock.year,
        }),
      ]);
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          companyOverrides: {
            id: baselineMock.companyId,
            status: CompanyStatus.Active,
          },
          roles,
        }),
      }));
    });

    afterAll(removeAllEmissionsData);

    describe('when carbon intensities are queried', () => {
      it('should return an array containing the intensity data', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
            query ($companyId: UUID!, $year: Int) {
              corporateEmissions(companyId: $companyId, year: $year) {
                id
                carbonIntensities {
                  intensityMetric
                  intensityValue
                }
              }
            }
          `,
          variables: { companyId: companyMock.id },
        });

        expect(result.data?.corporateEmissions).toEqual([
          {
            carbonIntensities: [
              {
                intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
                intensityValue: 200,
              },
              {
                intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
                intensityValue: 200000,
              },
            ],
            id: baselineMock.id,
          },
          {
            id: actualMock.id,
            carbonIntensities: [],
          },
        ]);
      });
    });
  });
});

const addEmissionsDataForRanks = async () => {
  const connection = await getOrCreateConnection();

  if (connection) {
    // current user company emissions
    // went up by 100%
    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: companyMock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 100,
      scope2: 200,
      offset: 123,
      year: currentYear,
      type: CorporateEmissionType.Actual,
      hasPreviousYearVerificationFile: true,
      hasVerificationFile: true,
    });
    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: companyMock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 100,
      scope2: 50,
      offset: 321,
      year: previousYear,
      type: CorporateEmissionType.Actual,
      hasPreviousYearVerificationFile: true,
      hasVerificationFile: true,
    });

    // other company emissions
    // went down by 50%
    await connection.getRepository(CorporateEmissionEntity).save({
      companyId: company2Mock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 100,
      scope2: 50,
      offset: 50,
      year: currentYear,
      type: CorporateEmissionType.Actual,
      hasPreviousYearVerificationFile: true,
      hasVerificationFile: true,
    });
    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: company2Mock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 100,
      scope2: 200,
      offset: 60,
      year: previousYear,
      type: CorporateEmissionType.Actual,
      hasPreviousYearVerificationFile: true,
      hasVerificationFile: true,
    });

    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: company3Mock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 999,
      scope2: 111,
      year: previousYear,
      type: CorporateEmissionType.Actual,
      hasPreviousYearVerificationFile: true,
      hasVerificationFile: true,
    });

    /* Records where scope_1 + scope_2 are both 0 should be omitted from rankings */
    await connection.getRepository(CorporateEmissionEntity).save({
      companyId: company3Mock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 0,
      scope2: 0,
      year: currentYear,
      type: CorporateEmissionType.Actual,
      hasPreviousYearVerificationFile: true,
      hasVerificationFile: true,
    });
  }
};

const addCompanySectorDataForRanks = async () => {
  const connection = await getOrCreateConnection();

  if (connection) {
    await connection?.getRepository(CompanySectorEntity).save({
      companyId: companySectorMock.companyId,
      createdBy: supplierEditorUserMock.id,
      sectorId: companySectorMock.sectorId,
      sectorType: companySectorMock.sectorType,
    });
    await connection?.getRepository(CompanySectorEntity).save({
      companyId: companySector3Mock.companyId,
      createdBy: supplierEditorUserMock.id,
      sectorId: companySector3Mock.sectorId,
      sectorType: companySector3Mock.sectorType,
    });
  }
};

const addSectorDataForRanks = async () => {
  const connection = await getOrCreateConnection();

  if (connection) {
    await connection?.getRepository(SectorEntity).save(sectorMock);
    await connection?.getRepository(SectorEntity).save(sector2Mock);
  }
};

describe('emissionResolvers - corporateEmissionRanks', () => {
  beforeEach(async () => {
    await removeAllEmissionsData();
    await addEmissionsDataForRanks();
    await addSectorDataForRanks();
    await addCompanySectorDataForRanks();
  });

  afterEach(async () => {
    await removeAllEmissionsData();
    await removeCompanySectorDataForRanks();
    await removeSectorDataForRanks();
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
        'should return corporate emission ranks for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!, $year: Int!) {
                corporateEmissionRanks(companyId: $companyId, year: $year) {
                  id
                  rank
                  currentYear
                  businessSector
                  subSector
                  primarySector
                  secondarySector
                  reductionPercentage
                  rankType
                  hasPreviousYearVerificationFile
                  hasVerificationFile
                }
              }
            `,
            variables: { companyId: companyMock.id, year: currentYear },
          });

          expect(result.data?.corporateEmissionRanks).toHaveLength(2);
          expect(result.data?.corporateEmissionRanks[0]).toEqual(
            expect.objectContaining({
              rank: 1,
              currentYear,
              businessSector: company2Mock.businessSection,
              subSector: company2Mock.subSector,
              primarySector: 'Automotive rental and leasing, without drivers',
              secondarySector: null,
              reductionPercentage: -50,
              rankType: ReductionRankType.Other,
            })
          );
          expect(result.data?.corporateEmissionRanks[1]).toEqual(
            expect.objectContaining({
              rank: 2,
              currentYear,
              businessSector: companyMock.businessSection,
              subSector: companyMock.subSector,
              primarySector: 'Electrical work',
              secondarySector: null,
              reductionPercentage: 100,
              rankType: ReductionRankType.Selected,
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
        ${RoleName.SupplierViewer}
      `(
        'should throw an error for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!, $year: Int!) {
                corporateEmissionRanks(companyId: $companyId, year: $year) {
                  rank
                }
              }
            `,
            variables: { companyId: companyMock.id, year: currentYear },
          });

          expect(result.data?.corporateEmissionRanks).toBeUndefined();
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

describe('emissionResolvers - corporateEmissionRank', () => {
  beforeEach(async () => {
    await addEmissionsDataForRanks();
    await addSectorDataForRanks();
    await addCompanySectorDataForRanks();
  });

  afterEach(async () => {
    await removeAllEmissionsData();
    await removeSectorDataForRanks();
    await removeCompanySectorDataForRanks();
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
        'should return corporate emission rank for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!, $year: Int!) {
                corporateEmissionRank(companyId: $companyId, year: $year) {
                  id
                  rank
                  currentYear
                  businessSector
                  subSector
                  primarySector
                  secondarySector
                  reductionPercentage
                  rankType
                  hasPreviousYearVerificationFile
                  hasVerificationFile
                }
              }
            `,
            variables: { companyId: companyMock.id, year: currentYear },
          });

          expect(result.data?.corporateEmissionRank).toEqual(
            expect.objectContaining({
              rank: 2,
              currentYear,
              businessSector: companyMock.businessSection,
              subSector: companyMock.subSector,
              reductionPercentage: 100,
              rankType: ReductionRankType.Selected,
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
        ${RoleName.SupplierViewer}
      `(
        'should throw an error for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
          query ($companyId: UUID!, $year: Int!) {
            corporateEmissionRank(companyId: $companyId, year: $year) {
              rank
            }
          }
        `,
            variables: { companyId: companyMock.id, year: currentYear },
          });

          expect(result.data?.corporateEmissionRank).toBeNull();
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

const addEmissionsDataForIntensity = async () => {
  // setup data in the DB
  const connection = await getOrCreateConnection();

  if (connection) {
    // current user company emissions
    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: companyMock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 1,
      scope2: 2,
      scope3: 3,
      headCount: 2,
      year: 2018,
      type: CorporateEmissionType.Actual,
    });
    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: companyMock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 1,
      scope2: 2,
      scope3: 3,
      headCount: 2,
      year: 2017,
      type: CorporateEmissionType.Actual,
    });

    // other company emissions
    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: company2Mock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 10,
      scope2: 20,
      scope3: 30,
      headCount: 5,
      year: 2018,
      type: CorporateEmissionType.Actual,
    });
    await connection?.getRepository(CorporateEmissionEntity).save({
      companyId: company2Mock.id,
      createdBy: supplierEditorUserMock.id,
      scope1: 10,
      scope2: 20,
      scope3: 30,
      headCount: 5,
      year: 2016,
      type: CorporateEmissionType.Actual,
    });
  }
};

describe('emissionResolvers - corporateCarbonIntensityComparisons', () => {
  beforeEach(async () => {
    await addEmissionsDataForIntensity();
  });

  afterEach(async () => {
    await removeAllEmissionsData();
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
        ${RoleName.SupplierViewer}
        ${RoleName.SupplierEditor}
      `(
        'should return corporate emission intensities for a $role of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const years = [2016, 2017, 2018];
          const result = await server.executeOperation({
            query: `
                query ($companyId: UUID!, $years: [Int!]!) {
                  corporateCarbonIntensityComparisons(companyId: $companyId, years: $years) {
                    year
                    sectorIntensity {
                      scope1
                      scope2
                      scope3
                    }
                    companyIntensity {
                      scope1
                      scope2
                      scope3
                    }
                  }
                }
              `,
            variables: { companyId: companyMock.id, years },
          });

          expect(result.data?.corporateCarbonIntensityComparisons).toHaveLength(
            years.length
          );

          expect(
            result.data?.corporateCarbonIntensityComparisons
          ).toMatchSnapshot();
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
        ${RoleName.SupplierViewer}
        ${RoleName.SupplierEditor}
      `(
        'should return an error for a $role of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const years = [2016, 2017, 2018];
          const result = await server.executeOperation({
            query: `
                query ($companyId: UUID!, $years: [Int!]!) {
                  corporateCarbonIntensityComparisons(companyId: $companyId, years: $years) {
                    year
                  }
                }
              `,
            variables: { companyId: companyMock.id, years },
          });

          expect(result.data?.corporateCarbonIntensityComparisons).toBeNull();
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

describe('emissionsResolvers - latestCorporateEmission', () => {
  describe.each`
    companyStatus
    ${CompanyStatus.Active}
    ${CompanyStatus.PendingUserActivation}
  `(
    'when user belongs to a company with $companyStatus status',
    ({ companyStatus }: { companyStatus: CompanyStatus }) => {
      beforeEach(async () => {
        const connection = await getOrCreateConnection();

        await Promise.all(
          [2016, 2019, 2018].map((year) => {
            return connection?.getRepository(CorporateEmissionEntity).save({
              companyId: companyMock.id,
              createdBy: supplierEditorUserMock.id,
              scope1: 100,
              scope2: 200,
              year,
              type: CorporateEmissionType.Actual,
            });
          })
        );
      });

      afterEach(async () => {
        await removeAllEmissionsData();
      });

      it.each`
        role
        ${RoleName.SupplierEditor}
        ${RoleName.SupplierViewer}
      `(
        'should return latest corporate emission for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!) {
                latestCorporateEmission(companyId: $companyId) {
                  id
                  year
                  scope1
                  scope2
                  scope3
                  scope2Type
                  offset
                  createdByUser {
                    id
                  }
                  company {
                    id
                  }
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.latestCorporateEmission).toEqual(
            expect.objectContaining({
              year: 2019,
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
        ${RoleName.SupplierViewer}
      `(
        'should throw an error for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!) {
                latestCorporateEmission(companyId: $companyId) {
                  id
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.latestCorporateEmission).toBeNull();
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

describe('emissionsResolvers - createCorporateEmission', () => {
  beforeAll(async () => {
    await removeAllEmissionsData();
  });

  afterEach(async () => {
    await removeAllEmissionsData();
  });

  const input = {
    scope1: baselineMock.scope1,
    scope2: baselineMock.scope2,
    scope3: baselineMock.scope3,
    offset: baselineMock.offset,
    scope2Type: baselineMock.scope2Type,
    headCount: baselineMock.headCount,
    verificationFileId: baselineMock.verificationFileId.toUpperCase(),
    companyId: supplierEditorUserMock.companyId,
    type: baselineMock.type,
    year: baselineMock.year,
    corporateEmissionAccess: baselineMock.corporateEmissionAccess,
  };

  describe.each`
    companyStatus
    ${CompanyStatus.Active}
    ${CompanyStatus.PendingUserActivation}
  `(
    'when user belongs to a company with $companyStatus status',
    ({ companyStatus }: { companyStatus: CompanyStatus }) => {
      it('should allow SUPPLIER_EDITOR to create an emission', async () => {
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
              status: companyStatus,
            },
            roles,
          }),
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
              mutation ($input: CreateCorporateEmissionInput!) {
                createCorporateEmission(input: $input) {
                  scope1
                  scope2
                  scope3
                  offset
                  scope2Type
                  headCount
                  verificationFile {
                    id
                  }
                  corporateEmissionAccess {
                    scope1And2
                    scope3
                    carbonOffsets
                    carbonIntensity
                    publicLink
                  }
                }
              }
            `,
          variables: {
            input,
          },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.createCorporateEmission).toEqual(
          expect.objectContaining({
            scope1: input.scope1,
            scope2: input.scope2,
            scope3: input.scope3,
            offset: input.offset,
            scope2Type: input.scope2Type,
            headCount: input.headCount,
            verificationFile: {
              id: input.verificationFileId,
            },
          })
        );
      });

      it.each`
        role
        ${RoleName.SupplierViewer}
      `(
        'should NOT allow a $role to create an emission',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
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
              mutation ($input: CreateCorporateEmissionInput!) {
                createCorporateEmission(input: $input) {
                  id
                }
              }
            `,
            variables: {
              input,
            },
          });

          expect(result.data?.createCorporateEmission).toBeNull();

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
      it('should NOT allow SUPPLIER_EDITOR to create an emission', async () => {
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
              status: companyStatus,
            },
            roles,
          }),
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: `
              mutation ($input: CreateCorporateEmissionInput!) {
                createCorporateEmission(input: $input) {
                  id
                }
              }
            `,
          variables: {
            input,
          },
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

  describe('when a user has permissions to create emissions', () => {
    it('should save data as normal when an empty carbon intensities array is provided', async () => {
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
            status: CompanyStatus.Active,
          },
          roles,
        }),
      }));

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: `
          mutation ($input: CreateCorporateEmissionInput!) {
            createCorporateEmission(input: $input) {
              scope1
              scope2
              scope3
              offset
              scope2Type
              headCount
            }
          }
        `,
        variables: {
          input: {
            ...input,
            carbonIntensities: [],
          },
        },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.createCorporateEmission).toEqual(
        expect.objectContaining({
          scope1: input.scope1,
          scope2: input.scope2,
          scope3: input.scope3,
          offset: input.offset,
          scope2Type: input.scope2Type,
          headCount: input.headCount,
        })
      );
    });

    it('should create a carbon intensity record for each value submitted on the payload', async () => {
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
            status: CompanyStatus.Active,
          },
          roles,
        }),
      }));

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: `
          mutation ($input: CreateCorporateEmissionInput!) {
            createCorporateEmission(input: $input) {
              id
              scope1
              scope2
              scope3
              offset
              scope2Type
              headCount
            }
          }
        `,
        variables: {
          input: {
            ...input,
            carbonIntensities: [
              { type: CarbonIntensityMetricType.UsdOfRevenue, value: 20000 },
              {
                type: CarbonIntensityMetricType.NumberOfEmployees,
                value: 3000,
              },
              { type: CarbonIntensityMetricType.NumberOfFte, value: 200 },
            ],
          },
        },
      });

      expect(result.errors).toBeUndefined();

      const emissionId = result.data?.createCorporateEmission.id;

      expect(emissionId).toBeTruthy();
      const carbonIntensities = await connection
        ?.getRepository(CarbonIntensityEntity)
        .find({
          where: { year: input.year, companyId: input.companyId, emissionId },
        });

      expect(carbonIntensities).toHaveLength(3);
      expect(carbonIntensities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            emissionId,
            companyId: input.companyId,
            intensityMetric: 'USD_OF_REVENUE',
            intensityValue: 20000,
          }),
          expect.objectContaining({
            emissionId,
            companyId: input.companyId,
            intensityMetric: 'NUMBER_OF_EMPLOYEES',
            intensityValue: 3000,
          }),
          expect.objectContaining({
            emissionId,
            companyId: input.companyId,
            intensityMetric: 'NUMBER_OF_FTE',
            intensityValue: 200,
          }),
        ])
      );
    });
  });
});

describe('emissionsResolvers - updateCorporateEmission', () => {
  const baseInput: UpdateCorporateEmissionInput = {
    id: baselineMock.id.toUpperCase(),
    year: baselineMock.year,
    scope1: baselineMock.scope1,
    scope2: baselineMock.scope2,
    scope3: baselineMock.scope3 ?? null,
    scope2Type: baselineMock.scope2Type,
    offset: baselineMock.offset ?? null,
    examplePercentage: baselineMock.examplePercentage,
    headCount: baselineMock.headCount,
    corporateEmissionAccess: baselineMock.corporateEmissionAccess,
    type: baselineMock.type,
  };

  const updateQuery = `
    mutation ($input: UpdateCorporateEmissionInput!) {
      updateCorporateEmission(input: $input) {
        year
        scope1
        scope2
        scope3
        offset
        scope2Type
        headCount
        type
        id
        verificationFile {
          id
        }
        corporateEmissionAccess {
          scope1And2
          scope3
          carbonOffsets
          carbonIntensity
          publicLink
        }
      }
    }
  `;

  beforeAll(async () => {
    await removeAllEmissionsData();
  });

  afterAll(async () => {
    const connection = await getOrCreateConnection();
    await connection?.getRepository(FileEntity).delete({ id: file2Mock.id });
  });

  beforeEach(async () => {
    ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(() => ({
      deleteFile: jest.fn(),
    }));

    const connection = await getOrCreateConnection();
    await connection.getRepository(FileEntity).save(file2Mock);
  });

  afterEach(async () => {
    await removeAllEmissionsData();
    jest.clearAllMocks();
  });

  describe.each`
    companyStatus
    ${CompanyStatus.Active}
  `(
    'when user belongs to a company with $companyStatus status',
    ({ companyStatus }: { companyStatus: CompanyStatus }) => {
      beforeEach(async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            userOverrides: {
              id: supplierEditorUserMock.id.toUpperCase(),
              companyId: companyMock.id,
            },
            companyOverrides: {
              id: companyMock.id,
              status: companyStatus,
            },
            roles,
          }),
        }));
      });

      describe('when baseline is updated to the year of an existing emission', () => {
        let currentBaselineEmission: CorporateEmissionEntity;
        let existingActualEmission: CorporateEmissionEntity;
        beforeEach(async () => {
          const corporateEmissionRepository = (
            await getOrCreateDBConnection()
          ).getCustomRepository(CorporateEmissionRepository);
          currentBaselineEmission = await corporateEmissionRepository.createEntity(
            {
              type: CorporateEmissionType.Baseline,
              companyId: companyMock.id,
              year: 2020,
              scope1: 100,
              scope2: 90,
              scope2Type: Scope2Type.Location,
              createdBy: supplierEditorUserMock.id,
            }
          );
          existingActualEmission = await corporateEmissionRepository.createEntity(
            {
              type: CorporateEmissionType.Actual,
              companyId: companyMock.id,
              year: 2019,
              scope1: 99,
              scope2: 80,
              scope2Type: Scope2Type.Location,
              createdBy: supplierEditorUserMock.id,
            }
          );
        });
        it('should update existing emission to be the Baseline and current baseline to Actual', async () => {
          const corporateEmissionRepository = (
            await getOrCreateDBConnection()
          ).getCustomRepository(CorporateEmissionRepository);
          const input: UpdateCorporateEmissionInput = {
            corporateEmissionAccess: {
              carbonIntensity: false,
              carbonOffsets: false,
              scope1And2: false,
              scope3: false,
            },
            id: existingActualEmission.id,
            scope1: 40,
            scope2: 45,
            scope2Type: Scope2Type.Market,
            type: CorporateEmissionType.Baseline,
            // what happens if year isn't 2019?
            year: 2019,
          };
          const server = getApolloServer();
          const result = await server.executeOperation({
            query: updateQuery,
            variables: {
              input,
            },
          });
          const updateCorporateEmission = result.data
            ?.updateCorporateEmission as CorporateEmission;
          expect(updateCorporateEmission.type).toEqual(
            CorporateEmissionType.Baseline
          );
          expect(updateCorporateEmission.id).toEqual(existingActualEmission.id);

          const {
            type: updatedExistingEmissionType,
          } = await corporateEmissionRepository.findOneOrFail({
            where: {
              id: existingActualEmission.id,
            },
          });
          expect(updatedExistingEmissionType).toEqual(
            CorporateEmissionType.Baseline
          );
          const {
            type: updateCurrentEmissionType,
          } = await corporateEmissionRepository.findOneOrFail({
            where: {
              id: currentBaselineEmission.id,
            },
          });
          expect(updateCurrentEmissionType).toEqual(
            CorporateEmissionType.Actual
          );
        });

        it('should fail when id and year do not match', async () => {
          const input: UpdateCorporateEmissionInput = {
            corporateEmissionAccess: {
              carbonIntensity: false,
              carbonOffsets: false,
              scope1And2: false,
              scope3: false,
            },
            id: existingActualEmission.id,
            scope1: 40,
            scope2: 45,
            scope2Type: Scope2Type.Market,
            type: CorporateEmissionType.Baseline,
            year: 2020,
          };
          const server = getApolloServer();
          const result = await server.executeOperation({
            query: updateQuery,
            variables: {
              input,
            },
          });
          expect(result.errors).toHaveLength(1);
          expect((result.errors as GraphQLFormattedError[])[0].message).toEqual(
            YEAR_EMISSION_EXISTS_ERROR
          );
        });
      });

      describe('when verification file is removed', () => {
        describe('on success', () => {
          it('should delete the file', async () => {
            const deleteBlob = jest.fn();
            ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(
              () => ({
                deleteFile: deleteBlob,
              })
            );
            const connection = await getOrCreateConnection();

            await connection
              ?.getRepository(CorporateEmissionEntity)
              .save({ ...baselineMock, verificationFileId: file2Mock.id });

            const server = getApolloServer();

            const input: UpdateCorporateEmissionInput = {
              ...baseInput,
              verificationFileId: null,
            };

            const result = await server.executeOperation({
              query: updateQuery,
              variables: {
                input,
              },
            });

            const deletedFile = await connection
              ?.getRepository(FileEntity)
              .findOne({ id: file2Mock.id });
            expect(deletedFile).toBeUndefined();

            expect(deleteBlob).toHaveBeenCalled();

            expect(result.errors).toBeUndefined();
            expect(result.data?.updateCorporateEmission).toEqual(
              expect.objectContaining({
                scope1: input.scope1,
                scope2: input.scope2,
                scope3: input.scope3,
                offset: input.offset,
                scope2Type: input.scope2Type,
                headCount: input.headCount,
                verificationFile: null,
              })
            );
          });
        });

        describe('on file deletion failure', () => {
          beforeEach(async () => {
            const connection = await getOrCreateConnection();

            await connection
              ?.getRepository(CorporateEmissionEntity)
              .save({ ...baselineMock, verificationFileId: file2Mock.id });
          });

          it('should not make any updates to the emission', async () => {
            const connection = await getOrCreateConnection();

            const blobDeleteErrorMessage = 'Blob could not be deleted';
            const deleteBlob = jest.fn();
            deleteBlob.mockRejectedValue(new Error(blobDeleteErrorMessage));
            ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(
              () => ({
                deleteFile: deleteBlob,
              })
            );

            const server = getApolloServer();

            const input: UpdateCorporateEmissionInput = {
              ...baseInput,
              verificationFileId: null,
            };

            const result = await server.executeOperation({
              query: updateQuery,
              variables: {
                input,
              },
            });

            const emission = await connection
              ?.getRepository(CorporateEmissionEntity)
              .findOne({ id: baselineMock.id });

            expect(emission?.verificationFileId).toBe(file2Mock.id);

            const file = await connection
              ?.getRepository(FileEntity)
              .findOne({ id: file2Mock.id });
            expect(file).not.toBeUndefined();

            expect(deleteBlob).toHaveBeenCalled();

            expect(result.errors).not.toBeUndefined();
            expect(result.data?.updateCorporateEmission).toBeNull();
          });
        });
      });

      describe('when verification file is replaced', () => {
        describe('on success', () => {
          it('should delete the old file', async () => {
            const deleteBlob = jest.fn();
            ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(
              () => ({
                deleteFile: deleteBlob,
              })
            );
            const connection = await getOrCreateConnection();

            await connection
              ?.getRepository(CorporateEmissionEntity)
              .save({ ...baselineMock, verificationFileId: file2Mock.id });

            const server = getApolloServer();

            const input: UpdateCorporateEmissionInput = {
              ...baseInput,
              verificationFileId: fileMock.id,
            };

            const result = await server.executeOperation({
              query: updateQuery,
              variables: {
                input,
              },
            });

            const deletedFile = await connection
              ?.getRepository(FileEntity)
              .findOne({ id: file2Mock.id });
            expect(deletedFile).toBeUndefined();

            expect(deleteBlob).toHaveBeenCalled();

            expect(result.errors).toBeUndefined();
            expect(result.data?.updateCorporateEmission).toEqual(
              expect.objectContaining({
                scope1: input.scope1,
                scope2: input.scope2,
                scope3: input.scope3,
                offset: input.offset,
                scope2Type: input.scope2Type,
                headCount: input.headCount,
                verificationFile: {
                  id: input.verificationFileId,
                },
              })
            );
          });
        });

        describe('on blob deletion failure', () => {
          it('should not make any updates to the emission', async () => {
            const deleteBlob = jest.fn();
            deleteBlob.mockRejectedValue(new Error('oopsy'));

            ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(
              () => ({
                deleteFile: deleteBlob,
              })
            );
            const connection = await getOrCreateConnection();

            await connection
              ?.getRepository(CorporateEmissionEntity)
              .save({ ...baselineMock, verificationFileId: file2Mock.id });

            const server = getApolloServer();

            const input: UpdateCorporateEmissionInput = {
              ...baseInput,
              verificationFileId: fileMock.id,
            };

            const result = await server.executeOperation({
              query: updateQuery,
              variables: {
                input,
              },
            });

            const emission = await connection
              ?.getRepository(CorporateEmissionEntity)
              .findOne({ id: baselineMock.id });

            expect(emission?.verificationFileId).toBe(file2Mock.id);

            const file = await connection
              ?.getRepository(FileEntity)
              .findOne({ id: file2Mock.id });
            expect(file).not.toBeUndefined();

            expect(deleteBlob).toHaveBeenCalled();

            expect(result.errors).not.toBeUndefined();
            expect(result.data?.updateCorporateEmission).toBeNull();
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
      it('should NOT allow SUPPLIER_EDITOR to update an emission', async () => {
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
              status: companyStatus,
            },
            roles,
          }),
        }));

        const input: UpdateCorporateEmissionInput = {
          ...baseInput,
          verificationFileId: baselineMock.verificationFileId.toUpperCase(),
          year: actualMock.year,
        };

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: updateQuery,
          variables: {
            input,
          },
        });

        expect(result.data?.updateCorporateEmission).toBeNull();

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

  describe('when a user is editing carbon intensities', () => {
    let connection: Connection;
    let corporateEmissionRepo: Repository<CorporateEmissionEntity>;
    let carbonIntensityRepo: CarbonIntensityRepository;
    let targetRepo: TargetRepository;
    const intensityTargetId = '';
    const numEmployeesCarbonIntensityId =
      'F8331989-A828-4756-AD4D-77E93CAE2F39';
    const usdRevenueCarbonIntensityId = '';

    const teardown = async () => {
      await connection.query('DELETE FROM CARBON_INTENSITY_TARGET');
      await targetRepo.delete([intensityTargetId]);
      await carbonIntensityRepo.delete([
        numEmployeesCarbonIntensityId,
        usdRevenueCarbonIntensityId,
      ]);
    };

    beforeAll(async () => {
      connection = await getOrCreateConnection();
      corporateEmissionRepo = connection.getRepository(CorporateEmissionEntity);
      carbonIntensityRepo = connection.getCustomRepository(
        CarbonIntensityRepository
      );
      targetRepo = connection.getCustomRepository(TargetRepository);
    });

    afterAll(async () => {
      await teardown();
    });

    beforeEach(async () => {
      await teardown();
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          userOverrides: {
            id: supplierEditorUserMock.id.toUpperCase(),
            companyId: companyMock.id,
          },
          companyOverrides: {
            id: companyMock.id,
            status: CompanyStatus.Active,
          },
          roles,
        }),
      }));

      /* Seed a corporate emission -- this is what we will update */
      const {
        id: emissionId,
        companyId,
        year,
      } = await corporateEmissionRepo.save({
        ...baselineMock,
        verificationFileId: null,
      });

      /* Seed carbon intensities associated with the corporate emission */
      await carbonIntensityRepo.save([
        {
          id: numEmployeesCarbonIntensityId,
          companyId,
          year,
          intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
          intensityValue: 3000,
          emissionId,
          createdBy: supplierEditorUserMock.id.toUpperCase(),
          updatedBy: supplierEditorUserMock.id.toUpperCase(),
        },
        {
          id: usdRevenueCarbonIntensityId,
          companyId,
          year,
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityValue: 1000,
          emissionId,
          createdBy: supplierEditorUserMock.id.toUpperCase(),
          updatedBy: supplierEditorUserMock.id.toUpperCase(),
        },
      ]);
    });

    it('should delete existing carbon intensity records, and replace with new', async () => {
      /* Assert the existing record has Carbon Intensity data associated */
      expect(
        await carbonIntensityRepo.find({
          where: {
            year: baselineMock.year,
            companyId: baselineMock.companyId,
            emissionId: baselineMock.id.toUpperCase(),
          },
        })
      ).toHaveLength(2);

      const server = getApolloServer();

      /* Pass an empty Carb Intensity array will nullify any previous records associated with the emission */
      await server.executeOperation({
        query: updateQuery,
        variables: {
          input: {
            ...baseInput,
            carbonIntensities: [],
          },
        },
      });

      expect(
        await carbonIntensityRepo.find({
          where: {
            year: baselineMock.year,
            companyId: baselineMock.companyId,
            emissionId: baselineMock.id.toUpperCase(),
          },
        })
      ).toHaveLength(0);

      /* Make another update, creating two new Carb Intensity records */
      await server.executeOperation({
        query: updateQuery,
        variables: {
          input: {
            ...baseInput,
            carbonIntensities: [
              { value: 1000, type: CarbonIntensityMetricType.CubicMetres },
              { value: 5000, type: CarbonIntensityMetricType.KgOfRawMilk },
            ],
          },
        },
      });

      expect(
        await carbonIntensityRepo.find({
          where: {
            year: baselineMock.year,
            companyId: baselineMock.companyId,
            emissionId: baselineMock.id.toUpperCase(),
          },
        })
      ).toHaveLength(2);
    });

    describe('when the carbon intensity is linked to an intensity target', () => {
      it('should delete the CARBON_INTENSITY_TARGET, and the associated TARGET', async () => {
        await targetRepo.save([
          createTargetMock({
            id: intensityTargetId,
            companyId: baselineMock.companyId,
            createdBy: baselineMock.createdBy,
            updatedBy: baselineMock.updatedBy,
            year: 2050,
            reduction: 50,
            strategy: TargetStrategyType.Aggressive,
            targetType: TargetType.Intensity,
            scopeType: TargetScopeType.Scope_1_2,
          }),
        ]);
        await connection.query(
          'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1)',
          [numEmployeesCarbonIntensityId, intensityTargetId]
        );

        const server = getApolloServer();

        await server.executeOperation({
          query: updateQuery,
          variables: {
            input: {
              ...baseInput,
              carbonIntensities: [],
            },
          },
        });

        expect(
          await carbonIntensityRepo.find({
            where: {
              year: baselineMock.year,
              companyId: baselineMock.companyId,
              emissionId: baselineMock.id.toUpperCase(),
            },
          })
        ).toHaveLength(0);
        expect(await targetRepo.find()).toHaveLength(0);
        expect(
          await connection.query(
            'SELECT COUNT(*) as count FROM CARBON_INTENSITY_TARGET'
          )
        ).toEqual([{ count: 0 }]);
      });
    });
  });
});

describe('emissionsResolvers - deleteCorporateEmission', () => {
  const baseInput: Partial<UpdateCorporateEmissionInput> = {
    id: baselineMock.id,
  };

  const deleteQuery = `
    mutation ($input: DeleteCorporateEmissionInput!) {
      deleteCorporateEmission(input: $input)
    }
  `;

  beforeAll(async () => {
    await removeAllEmissionsData();
  });

  beforeEach(async () => {
    ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(() => ({
      deleteFile: jest.fn(),
    }));

    const connection = await getOrCreateConnection();
    await connection?.getRepository(FileEntity).save(file2Mock);
    await connection
      .getRepository(CorporateEmissionEntity)
      .save({ ...baselineMock, verificationFileId: file2Mock.id });

    await connection
      .getRepository(CorporateEmissionAccessEntity)
      .save({ ...emissionAccessMock, emissionId: baselineMock.id });
  });

  afterEach(async () => {
    await removeAllEmissionsData();
    const connection = await getOrCreateConnection();
    await connection.getRepository(FileEntity).delete({ id: file2Mock.id });
    jest.clearAllMocks();
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
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            userOverrides: { companyId: companyMock.id },
            companyOverrides: {
              id: companyMock.id,
              status: companyStatus,
            },
            roles,
          }),
        }));
      });

      describe('on success', () => {
        it('should delete emission', async () => {
          const connection = await getOrCreateConnection();
          const server = getApolloServer();

          const emissionBefore = await connection
            ?.getRepository(CorporateEmissionEntity)
            .findOne(
              { id: baselineMock.id },
              { relations: ['corporateEmissionAccess'] }
            );

          expect(emissionBefore).not.toBeUndefined();

          expect(emissionBefore?.corporateEmissionAccess).not.toBeNull();

          const fileBefore = await connection
            ?.getRepository(FileEntity)
            .findOne({ id: file2Mock.id });
          expect(fileBefore).not.toBeUndefined();

          const result = await server.executeOperation({
            query: deleteQuery,
            variables: {
              input: baseInput,
            },
          });

          expect(result.data?.deleteCorporateEmission).toBe(
            baselineMock.id.toUpperCase()
          );

          const emissionAfter = await connection
            ?.getRepository(CorporateEmissionEntity)
            .findOne({ id: baselineMock.id.toUpperCase() });

          expect(emissionAfter).toBeUndefined();

          const emissionAccessAfter = await connection
            ?.getRepository(CorporateEmissionAccessEntity)
            .findOne({
              where: {
                emissionId: baselineMock.id,
              },
            });

          expect(emissionAccessAfter).toBeUndefined();

          const fileAfter = await connection
            ?.getRepository(FileEntity)
            .findOne({ id: file2Mock.id });
          expect(fileAfter).toBeUndefined();
        });
      });

      describe('on failure', () => {
        it('should not delete emission or file', async () => {
          const deleteFile = jest.fn();
          deleteFile.mockImplementation(() => {
            throw new Error('oops');
          });
          ((AzureBlobClient as unknown) as jest.Mock).mockReset();
          ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(
            () => ({
              deleteFile,
            })
          );
          const connection = await getOrCreateConnection();
          const server = getApolloServer();

          const emissionBefore = await connection
            ?.getRepository(CorporateEmissionEntity)
            .findOne({ id: baselineMock.id });

          expect(emissionBefore).not.toBeUndefined();

          const fileBefore = await connection
            ?.getRepository(FileEntity)
            .findOne({ id: file2Mock.id });
          expect(fileBefore).not.toBeUndefined();

          const result = await server.executeOperation({
            query: deleteQuery,
            variables: {
              input: baseInput,
            },
          });
          expect(result.data?.deleteCorporateEmission).toBeNull();
          expect(result.errors).not.toBeUndefined();

          const emissionAfter = await connection
            ?.getRepository(CorporateEmissionEntity)
            .findOne({ id: baselineMock.id });

          expect(emissionAfter).not.toBeUndefined();

          const fileAfter = await connection
            ?.getRepository(FileEntity)
            .findOne({ id: file2Mock.id });
          expect(fileAfter).not.toBeUndefined();
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
      it('should return an error', async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
          user: getCurrentUser({
            companyOverrides: {
              status: companyStatus,
            },
            roles,
          }),
        }));

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: deleteQuery,
          variables: {
            input: baseInput,
          },
        });

        expect(result.data?.deleteCorporateEmission).toBeNull();

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

describe('emissionsResolvers - baseline', () => {
  describe.each`
    companyStatus
    ${CompanyStatus.Active}
    ${CompanyStatus.PendingUserActivation}
  `(
    'when user belongs to a company with $companyStatus status',
    ({ companyStatus }: { companyStatus: CompanyStatus }) => {
      beforeEach(async () => {
        const connection = await getOrCreateConnection();

        await connection
          ?.getRepository(CorporateEmissionEntity)
          .save([baselineMock]);
      });

      afterEach(async () => {
        await removeAllEmissionsData();
      });

      it.each`
        role
        ${RoleName.SupplierEditor}
        ${RoleName.SupplierViewer}
      `(
        'should return baseline emission for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!) {
                baseline(companyId: $companyId) {
                  id
                  year
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.baseline).toEqual(
            expect.objectContaining({
              year: baselineMock.year,
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
        ${RoleName.SupplierViewer}
      `(
        'should throw an error for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!) {
                latestCorporateEmission(companyId: $companyId) {
                  id
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.latestCorporateEmission).toBeNull();
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

describe('emissionsResolvers - baseline', () => {
  describe.each`
    companyStatus
    ${CompanyStatus.Active}
    ${CompanyStatus.PendingUserActivation}
  `(
    'when user belongs to a company with $companyStatus status',
    ({ companyStatus }: { companyStatus: CompanyStatus }) => {
      beforeEach(async () => {
        const connection = await getOrCreateConnection();

        await connection
          .getRepository(CorporateEmissionEntity)
          .save([baselineMock]);
      });

      afterEach(async () => {
        await removeAllEmissionsData();
      });

      it.each`
        role
        ${RoleName.SupplierEditor}
        ${RoleName.SupplierViewer}
      `(
        'should return baseline emission for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!) {
                baseline(companyId: $companyId) {
                  id
                  year
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.baseline).toEqual(
            expect.objectContaining({
              year: baselineMock.year,
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
        ${RoleName.SupplierViewer}
      `(
        'should throw an error for a "$role" of a company',
        async ({ role }: { role: RoleName }) => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);
          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                userOverrides: { companyId: companyMock.id },
                companyOverrides: { id: companyMock.id, status: companyStatus },
                roles,
              }),
            })
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: `
              query ($companyId: UUID!) {
                latestCorporateEmission(companyId: $companyId) {
                  id
                }
              }
            `,
            variables: { companyId: companyMock.id },
          });

          expect(result.data?.latestCorporateEmission).toBeNull();
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
