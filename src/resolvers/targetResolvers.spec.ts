import { ApolloError } from 'apollo-server-express';

import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import {
  CarbonIntensityMetricType,
  CompanyStatus,
  CorporateEmissionType,
  MutationSaveTargetsArgs,
  TargetPrivacyType,
  RoleName,
  TargetScopeType,
  TargetStrategyType,
  TargetType,
} from '../types';

import { companyMock, createCompanyMock } from '../mocks/company';
import { getOrCreateConnection } from '../dbConnection';
import {
  createTargetMock,
  targetMock,
  targetScope3Mock,
} from '../mocks/target';
import { TargetEntity } from '../entities/Target';
import { NO_ACCESS_TO_FIELD_ERROR } from '../directives/transformers/hasRole';
import { NO_ACCESS_TO_FIELD_ERROR as COMPANY_ERROR } from '../directives/transformers/belongsToApprovedCompany';
import {
  createUserMock,
  getCurrentUser,
  supplierEditorUserMock,
} from '../mocks/user';
import { Connection } from 'typeorm';
import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import { createCorporateEmissionMock } from '../mocks/emission';
import { CarbonIntensityEntity } from '../entities/CarbonIntensity';
import { UserEntity } from '../entities/User';
import { createCarbonIntensityMock } from '../mocks/carbonIntensities';
import {
  INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE,
  MAX_ABSOLUTE_TARGETS_EXCEEDED_ERROR,
  MAX_ABSOLUTE_TARGETS_PER_COMPANY,
  MAX_INTENSITY_TARGETS_EXCEEDED_ERROR,
  MAX_INTENSITY_TARGETS_PER_COMPANY,
  NO_BASELINE_ERROR,
} from '../controllers/TargetController/constants';
import { CompanyEntity } from '../entities/Company';
import { AuditEntity } from '../entities/Audit';
import {
  TARGET_CREATED_ACTION,
  TARGET_DELETED_ACTION,
  TARGET_UPDATED_ACTION,
} from '../constants/audit';
import { UserRepository } from '../repositories/UserRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { USER_COMPANY_ERROR } from '../errors/commonErrorMessages';

jest.mock('../auth');

describe('targetResolvers', () => {
  let connection: Connection;
  const year = 2020;
  const userId = '';
  const companyId = '';
  const anotherCompanyId = '';
  const corporateEmissionId = '';
  const carbonIntensityId = '';
  const secondCarbonIntensityId = '';
  const absoluteTargetScope12Id = '';
  const absoluteTargetScope3Id = '';
  const intensityTargetScope12Id = '';
  const intensityTargetScope3Id = '';

  beforeAll(async () => {
    connection = await getOrCreateConnection();
  });

  describe('target', () => {
    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        describe('when scope 1 and 2 target and scope 3 target have been set', () => {
          beforeAll(async () => {
            await connection.getRepository(TargetEntity).save(targetMock);
            await connection
              ?.getRepository(TargetEntity)
              .save(targetScope3Mock);
          });

          afterAll(async () => {
            await connection.getRepository(TargetEntity).delete({});
          });

          it.each`
            role
            ${RoleName.SupplierEditor}
            ${RoleName.SupplierViewer}
          `(
            'should return target for a "$role" company',
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
                query: `
                query ($companyId: UUID!) {
                  target(companyId: $companyId) {
                    scope1And2Year
                    scope1And2Reduction
                    scope3Year
                    scope3Reduction
                    strategy
                    includeCarbonOffset
                  }
                }
              `,
                variables: { companyId: companyMock.id },
              });

              expect(result.data?.target).toEqual(
                expect.objectContaining({
                  scope1And2Year: targetMock.year,
                  scope1And2Reduction: targetMock.reduction,
                  scope3Year: targetScope3Mock.year,
                  scope3Reduction: targetScope3Mock.reduction,
                  strategy: targetMock.strategy,
                  includeCarbonOffset: targetMock.includeCarbonOffset,
                })
              );
              expect(result.errors).toBeUndefined();
            }
          );
        });

        describe('when scope 1 and 2 target has been set', () => {
          beforeAll(async () => {
            await connection.getRepository(TargetEntity).save(targetMock);
          });

          afterAll(async () => {
            await connection.getRepository(TargetEntity).delete({});
          });

          it.each`
            role
            ${RoleName.SupplierEditor}
            ${RoleName.SupplierViewer}
          `(
            'should return target for a "$role" company',
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
                query: `
                query ($companyId: UUID!) {
                  target(companyId: $companyId) {
                    scope1And2Year
                    scope1And2Reduction
                    scope3Year
                    scope3Reduction
                    strategy
                    includeCarbonOffset
                  }
                }
              `,
                variables: { companyId: companyMock.id },
              });

              expect(result.data?.target).toEqual(
                expect.objectContaining({
                  scope1And2Year: targetMock.year,
                  scope1And2Reduction: targetMock.reduction,
                  scope3Year: null,
                  scope3Reduction: null,
                  strategy: targetMock.strategy,
                  includeCarbonOffset: targetMock.includeCarbonOffset,
                })
              );
              expect(result.errors).toBeUndefined();
            }
          );
        });

        describe('when target has not been set yet', () => {
          it.each`
            role
            ${RoleName.SupplierEditor}
            ${RoleName.SupplierViewer}
          `(
            'should return undefined for a "$role" company',
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
                query: `
                query ($companyId: UUID!) {
                  target(companyId: $companyId) {
                    scope1And2Year
                    scope1And2Reduction
                    scope3Year
                    scope3Reduction
                    strategy
                    includeCarbonOffset
                  }
                }
              `,
                variables: { companyId: companyMock.id },
              });

              expect(result.data?.target).toBeNull();
              expect(result.errors).toBeUndefined();
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
        it.each`
          role
          ${RoleName.SupplierEditor}
          ${RoleName.SupplierViewer}
        `(
          'should return target for a "$role" company',
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
              query: `
                query ($companyId: UUID!) {
                  target(companyId: $companyId) {
                    strategy
                  }
                }
              `,
              variables: { companyId: companyMock.id },
            });

            expect(result.data?.target).toBeNull();

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

  describe('targets', () => {
    const TARGETS_QUERY = `
      query ($companyId: UUID!) {
        targets(companyId: $companyId) {
          absolute {
            scope1And2Year
            scope1And2Reduction
            scope3Year
            scope3Reduction
            strategy
            includeCarbonOffset
          }
          intensity {
            scope1And2Year
            scope1And2Reduction
            scope3Year
            scope3Reduction
            strategy
            includeCarbonOffset
            intensityMetric
            intensityValue
          }
        }
      }
    `;

    const teardown = async () => {
      try {
        await connection.query('DELETE FROM CARBON_INTENSITY_TARGET');
        await connection
          .getRepository(TargetEntity)
          .delete([
            absoluteTargetScope12Id,
            absoluteTargetScope3Id,
            intensityTargetScope12Id,
            intensityTargetScope3Id,
          ]);
        await connection
          .getRepository(CarbonIntensityEntity)
          .delete([carbonIntensityId, secondCarbonIntensityId]);
        await connection
          .getRepository(CorporateEmissionEntity)
          .delete([corporateEmissionId]);
        await connection
          .getCustomRepository(UserRepository)
          .deleteUsers([userId]);
        await connection.getRepository(UserEntity).delete([userId]);
      } catch (error) {
        console.error('THE ERROR', error);
      }
    };

    const setup = async () => {
      await connection.getRepository(UserEntity).save([
        await createUserMock(
          {
            id: userId,
            companyId: companyMock.id,
          },
          RoleName.SupplierEditor
        ),
      ]);

      await connection.getRepository(CorporateEmissionEntity).save([
        createCorporateEmissionMock({
          id: corporateEmissionId,
          companyId: companyMock.id,
          year,
        }),
      ]);
    };

    beforeAll(async () => {
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          userOverrides: {
            companyId: companyMock.id,
            id: userId,
          },
          companyOverrides: {
            id: companyMock.id,
          },
          roles,
        }),
      }));
    });

    beforeEach(async () => {
      await teardown();
      await setup();
    });

    afterAll(async () => {
      await teardown();
    });

    describe('when a user has only absolute targets', () => {
      describe('when a user has only scope_1_2 data', () => {
        it('should include the target data in the response', async () => {
          await connection.getRepository(TargetEntity).save([
            createTargetMock({
              id: absoluteTargetScope12Id,
              companyId: companyMock.id,
              createdBy: userId,
              updatedBy: userId,
              year: 2050,
              reduction: 50,
              strategy: TargetStrategyType.Aggressive,
              targetType: TargetType.Absolute,
              scopeType: TargetScopeType.Scope_1_2,
            }),
          ]);

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: TARGETS_QUERY,
            variables: { companyId: companyMock.id },
          });

          expect(result.errors).toBeUndefined();
          expect(result.data?.targets).toEqual({
            absolute: [
              expect.objectContaining({
                scope1And2Year: 2050,
                scope1And2Reduction: 50,
                strategy: TargetStrategyType.Aggressive,
                scope3Year: null,
                scope3Reduction: null,
              }),
            ],
            intensity: [],
          });
        });
      });

      describe('when a user has scope_1_2 and scope_3 data', () => {
        it('should include target data in the response', async () => {
          await connection.getRepository(TargetEntity).save([
            createTargetMock({
              id: absoluteTargetScope12Id,
              companyId: companyMock.id,
              createdBy: userId,
              updatedBy: userId,
              year: 2050,
              reduction: 50,
              strategy: TargetStrategyType.Aggressive,
              targetType: TargetType.Absolute,
              scopeType: TargetScopeType.Scope_1_2,
            }),
            createTargetMock({
              id: absoluteTargetScope3Id,
              companyId: companyMock.id,
              createdBy: userId,
              updatedBy: userId,
              year: 2030,
              reduction: 30,
              strategy: TargetStrategyType.Aggressive,
              targetType: TargetType.Absolute,
              scopeType: TargetScopeType.Scope_3,
            }),
          ]);

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: TARGETS_QUERY,
            variables: { companyId: companyMock.id },
          });

          expect(result.errors).toBeUndefined();
          expect(result.data?.targets).toEqual({
            absolute: [
              expect.objectContaining({
                scope1And2Year: 2050,
                scope1And2Reduction: 50,
                strategy: TargetStrategyType.Aggressive,
                scope3Year: 2030,
                scope3Reduction: 30,
              }),
            ],
            intensity: [],
          });
        });
      });
    });

    describe('when a user has only intensity targets', () => {
      describe('when a user has only scope_1_2 data', () => {
        it('should return the intensities data', async () => {
          await connection.getRepository(TargetEntity).save([
            createTargetMock({
              id: intensityTargetScope12Id,
              companyId: companyMock.id,
              createdBy: userId,
              updatedBy: userId,
              year: 2050,
              reduction: 50,
              strategy: TargetStrategyType.Aggressive,
              targetType: TargetType.Intensity,
              scopeType: TargetScopeType.Scope_1_2,
            }),
          ]);
          await connection.getRepository(CarbonIntensityEntity).save([
            createCarbonIntensityMock({
              id: carbonIntensityId,
              companyId: companyMock.id,
              createdBy: userId,
              updatedBy: userId,
              emissionId: corporateEmissionId,
              intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
              intensityValue: 200000,
            }),
          ]);
          await connection.query(
            'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1)',
            [carbonIntensityId, intensityTargetScope12Id]
          );

          const server = getApolloServer();

          const result = await server.executeOperation({
            query: TARGETS_QUERY,
            variables: { companyId: companyMock.id },
          });

          expect(result.errors).toBeUndefined();
          expect(result.data?.targets).toEqual({
            absolute: [],
            intensity: [
              expect.objectContaining({
                scope1And2Year: 2050,
                scope1And2Reduction: 50,
                strategy: TargetStrategyType.Aggressive,
                scope3Year: null,
                scope3Reduction: null,
                intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
                intensityValue: 200000,
              }),
            ],
          });
        });
      });

      describe('when a user has multiple intensity targets', () => {
        describe('when a user has scope_1_2 and scope_3 data', () => {
          it('should populate all data on the target payload', async () => {
            await connection.getRepository(TargetEntity).save([
              createTargetMock({
                id: intensityTargetScope12Id,
                companyId: companyMock.id,
                createdBy: userId,
                updatedBy: userId,
                year: 2050,
                reduction: 50,
                strategy: TargetStrategyType.Aggressive,
                targetType: TargetType.Intensity,
                scopeType: TargetScopeType.Scope_1_2,
              }),
              createTargetMock({
                id: intensityTargetScope3Id,
                companyId: companyMock.id,
                createdBy: userId,
                updatedBy: userId,
                year: 2030,
                reduction: 20,
                strategy: TargetStrategyType.Aggressive,
                targetType: TargetType.Intensity,
                scopeType: TargetScopeType.Scope_3,
              }),
            ]);
            await connection.getRepository(CarbonIntensityEntity).save([
              createCarbonIntensityMock({
                id: carbonIntensityId,
                companyId: companyMock.id,
                createdBy: userId,
                updatedBy: userId,
                emissionId: corporateEmissionId,
                intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
                intensityValue: 200000,
              }),
            ]);
            await connection.query(
              'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1)',
              [carbonIntensityId, intensityTargetScope12Id]
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: TARGETS_QUERY,
              variables: { companyId: companyMock.id },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.targets).toEqual({
              absolute: [],
              intensity: [
                expect.objectContaining({
                  scope1And2Year: 2050,
                  scope1And2Reduction: 50,
                  strategy: TargetStrategyType.Aggressive,
                  scope3Year: 2030,
                  scope3Reduction: 20,
                  intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
                  intensityValue: 200000,
                }),
              ],
            });
          });
        });

        describe('when a user has a target associated to two carbon intensities', () => {
          it('should return a target for each intensity', async () => {
            await connection.getRepository(TargetEntity).save([
              createTargetMock({
                id: intensityTargetScope12Id,
                companyId: companyMock.id,
                createdBy: userId,
                updatedBy: userId,
                year: 2050,
                reduction: 50,
                strategy: TargetStrategyType.Aggressive,
                targetType: TargetType.Intensity,
                scopeType: TargetScopeType.Scope_1_2,
              }),
              createTargetMock({
                id: intensityTargetScope3Id,
                companyId: companyMock.id,
                createdBy: userId,
                updatedBy: userId,
                year: 2030,
                reduction: 20,
                strategy: TargetStrategyType.Aggressive,
                targetType: TargetType.Intensity,
                scopeType: TargetScopeType.Scope_3,
              }),
            ]);
            await connection.getRepository(CarbonIntensityEntity).save([
              createCarbonIntensityMock({
                id: carbonIntensityId,
                companyId: companyMock.id,
                createdBy: userId,
                updatedBy: userId,
                emissionId: corporateEmissionId,
                intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
                intensityValue: 200000,
              }),
              createCarbonIntensityMock({
                id: secondCarbonIntensityId,
                companyId: companyMock.id,
                createdBy: userId,
                updatedBy: userId,
                emissionId: corporateEmissionId,
                intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
                intensityValue: 800,
              }),
            ]);
            await connection.query(
              'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1), (@2, @1)',
              [
                carbonIntensityId,
                intensityTargetScope12Id,
                secondCarbonIntensityId,
              ]
            );

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: TARGETS_QUERY,
              variables: { companyId: companyMock.id },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.targets).toEqual({
              absolute: [],
              intensity: expect.arrayContaining([
                expect.objectContaining({
                  scope1And2Year: 2050,
                  scope1And2Reduction: 50,
                  strategy: TargetStrategyType.Aggressive,
                  scope3Year: 2030,
                  scope3Reduction: 20,
                  intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
                  intensityValue: 200000,
                }),
                expect.objectContaining({
                  scope1And2Year: 2050,
                  scope1And2Reduction: 50,
                  strategy: TargetStrategyType.Aggressive,
                  scope3Year: 2030,
                  scope3Reduction: 20,
                  intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
                  intensityValue: 800,
                }),
              ]),
            });
          });
        });
      });
    });

    describe('when a user does not have any targets', () => {
      it('should return an empty object', async () => {
        const server = getApolloServer();

        const result = await server.executeOperation({
          query: TARGETS_QUERY,
          variables: { companyId: companyMock.id },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.targets).toEqual({
          absolute: [],
          intensity: [],
        });
      });
    });

    describe('when a user has absolute and intensity targets', () => {
      it('should return data for absolute and intensity', async () => {
        await connection.getRepository(TargetEntity).save([
          createTargetMock({
            id: absoluteTargetScope12Id,
            companyId: companyMock.id,
            createdBy: userId,
            updatedBy: userId,
            year: 2030,
            reduction: 30,
            strategy: TargetStrategyType.Aggressive,
            targetType: TargetType.Absolute,
            scopeType: TargetScopeType.Scope_1_2,
          }),
          createTargetMock({
            id: absoluteTargetScope3Id,
            companyId: companyMock.id,
            createdBy: userId,
            updatedBy: userId,
            year: 2040,
            reduction: 40,
            strategy: TargetStrategyType.Aggressive,
            targetType: TargetType.Absolute,
            scopeType: TargetScopeType.Scope_3,
          }),
          createTargetMock({
            id: intensityTargetScope12Id,
            companyId: companyMock.id,
            createdBy: userId,
            updatedBy: userId,
            year: 2025,
            reduction: 50,
            strategy: TargetStrategyType.Aggressive,
            targetType: TargetType.Intensity,
            scopeType: TargetScopeType.Scope_1_2,
          }),
          createTargetMock({
            id: intensityTargetScope3Id,
            companyId: companyMock.id,
            createdBy: userId,
            updatedBy: userId,
            year: 2035,
            reduction: 20,
            strategy: TargetStrategyType.Aggressive,
            targetType: TargetType.Intensity,
            scopeType: TargetScopeType.Scope_3,
          }),
        ]);
        await connection.getRepository(CarbonIntensityEntity).save([
          createCarbonIntensityMock({
            id: carbonIntensityId,
            companyId: companyMock.id,
            createdBy: userId,
            updatedBy: userId,
            emissionId: corporateEmissionId,
            intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
            intensityValue: 200000,
          }),
        ]);
        await connection.query(
          'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1)',
          [carbonIntensityId, intensityTargetScope12Id]
        );

        const server = getApolloServer();

        const result = await server.executeOperation({
          query: TARGETS_QUERY,
          variables: { companyId: companyMock.id },
        });

        expect(result.errors).toBeUndefined();
        expect(result.data?.targets).toEqual({
          absolute: [
            {
              scope1And2Year: 2030,
              scope1And2Reduction: 30,
              strategy: TargetStrategyType.Aggressive,
              scope3Year: 2040,
              scope3Reduction: 40,
              includeCarbonOffset: false,
            },
          ],
          intensity: [
            {
              scope1And2Year: 2025,
              scope1And2Reduction: 50,
              strategy: TargetStrategyType.Aggressive,
              scope3Year: 2035,
              scope3Reduction: 20,
              includeCarbonOffset: false,
              intensityMetric: CarbonIntensityMetricType.KgOfRawMilk,
              intensityValue: 200000,
            },
          ],
        });
      });
    });
  });

  describe('createTarget', () => {
    const createTargetQuery = `
      mutation ($input: CreateTargetInput!) {
        createTarget(input: $input) {
          scope1And2Year
          scope1And2Reduction
          scope3Year
          scope3Reduction
          strategy
          includeCarbonOffset
        }
      }
    `;

    const scope123Input = {
      companyId: targetMock.companyId,
      strategy: targetMock.strategy,
      includeCarbonOffset: targetMock.includeCarbonOffset,
      scope1And2Year: targetMock.year,
      scope1And2Reduction: targetMock.reduction,
      scope3Year: targetScope3Mock.year,
      scope3Reduction: targetScope3Mock.reduction,
      targetType: TargetType.Absolute,
    };

    afterEach(async () => {
      await connection.getRepository(TargetEntity).delete({});
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        describe('when setting scope 1,2 and 3 targets', () => {
          it('should allow a SUPPLIER_EDITOR to create targets', async () => {
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
              query: createTargetQuery,
              variables: { input: scope123Input },
            });

            const targets = await connection
              ?.getRepository(TargetEntity)
              .find({ companyId: supplierEditorUserMock.companyId });

            expect(targets).toHaveLength(2);
            expect(targets).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  year: targetMock.year,
                  reduction: targetMock.reduction,
                  includeCarbonOffset: targetMock.includeCarbonOffset,
                  strategy: targetMock.strategy,
                  companyId: targetMock.companyId,
                }),
                expect.objectContaining({
                  year: targetScope3Mock.year,
                  reduction: targetScope3Mock.reduction,
                  includeCarbonOffset: targetMock.includeCarbonOffset,
                  strategy: targetMock.strategy,
                  companyId: targetMock.companyId,
                }),
              ])
            );

            expect(result.data?.createTarget).toEqual(
              expect.objectContaining({
                scope1And2Year: targetMock.year,
                scope1And2Reduction: targetMock.reduction,
                scope3Year: targetScope3Mock.year,
                scope3Reduction: targetScope3Mock.reduction,
                strategy: targetMock.strategy,
                includeCarbonOffset: targetMock.includeCarbonOffset,
              })
            );
            expect(result.errors).toBeUndefined();
          });
        });

        describe('when setting scope 1,2 target', () => {
          it.each`
            role
            ${RoleName.SupplierEditor}
            ${RoleName.Admin}
          `(
            'should allow a "$role" to create one target',
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

              const input = {
                companyId: targetMock.companyId,
                strategy: targetMock.strategy,
                includeCarbonOffset: targetMock.includeCarbonOffset,
                scope1And2Year: targetMock.year,
                scope1And2Reduction: targetMock.reduction,
                targetType: TargetType.Absolute,
              };

              const server = getApolloServer();

              const result = await server.executeOperation({
                query: createTargetQuery,
                variables: { input },
              });

              const targets = await connection
                ?.getRepository(TargetEntity)
                .find({ companyId: supplierEditorUserMock.companyId });

              expect(targets).toHaveLength(1);
              expect(targets).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    year: targetMock.year,
                    reduction: targetMock.reduction,
                    includeCarbonOffset: targetMock.includeCarbonOffset,
                    strategy: targetMock.strategy,
                    companyId: targetMock.companyId,
                  }),
                ])
              );

              expect(result.data?.createTarget).toEqual(
                expect.objectContaining({
                  scope1And2Year: targetMock.year,
                  scope1And2Reduction: targetMock.reduction,
                  scope3Year: null,
                  scope3Reduction: null,
                  strategy: targetMock.strategy,
                  includeCarbonOffset: targetMock.includeCarbonOffset,
                })
              );
              expect(result.errors).toBeUndefined();
            }
          );
        });

        it.each`
          role
          ${RoleName.SupplierViewer}
        `(
          'should not allow $role to create a target',
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

            const input = {
              companyId: targetMock.companyId,
              strategy: targetMock.strategy,
              includeCarbonOffset: targetMock.includeCarbonOffset,
              scope1And2Year: targetMock.year,
              scope1And2Reduction: targetMock.reduction,
              targetType: TargetType.Absolute,
            };

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: createTargetQuery,
              variables: { input },
            });

            expect(result.data?.createTarget).toBeUndefined;
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
        it('should NOT allow a SUPPLIER_EDITOR to create targets', async () => {
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
            query: createTargetQuery,
            variables: { input: scope123Input },
          });

          expect(result.data?.createTarget).toBeNull();

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

  describe('updateTarget', () => {
    const updateTargetMutation = `
      mutation ($input: UpdateTargetInput!) {
        updateTarget(input: $input) {
          scope1And2Year
          scope1And2Reduction
          scope3Year
          scope3Reduction
          strategy
          includeCarbonOffset
        }
      }
    `;

    const scope123UpdateInput = {
      companyId: targetMock.companyId,
      strategy: TargetStrategyType.Moderate,
      includeCarbonOffset: true,
      scope1And2Year: 2066,
      scope1And2Reduction: 100,
      scope3Year: 2077,
      scope3Reduction: 99,
      targetType: TargetType.Absolute,
    };

    afterEach(async () => {
      await connection.getRepository(TargetEntity).delete({});
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        describe('when both scope 1 and 2 target and scope 3 target has been set', () => {
          beforeEach(async () => {
            await connection.getRepository(TargetEntity).save(targetMock);
            await connection.getRepository(TargetEntity).save(targetScope3Mock);
          });

          it('should allow a SUPPLIER_EDITOR to update targets', async () => {
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
              query: updateTargetMutation,
              variables: { input: scope123UpdateInput },
            });

            const targets = await connection
              .getRepository(TargetEntity)
              .find({ companyId: supplierEditorUserMock.companyId });

            expect(targets).toHaveLength(2);
            expect(targets).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  year: scope123UpdateInput.scope1And2Year,
                  reduction: scope123UpdateInput.scope1And2Reduction,
                  includeCarbonOffset: scope123UpdateInput.includeCarbonOffset,
                  strategy: scope123UpdateInput.strategy,
                }),
                expect.objectContaining({
                  year: scope123UpdateInput.scope3Year,
                  reduction: scope123UpdateInput.scope3Reduction,
                  includeCarbonOffset: scope123UpdateInput.includeCarbonOffset,
                  strategy: scope123UpdateInput.strategy,
                }),
              ])
            );

            expect(result.data?.updateTarget).toEqual(
              expect.objectContaining({
                scope1And2Year: scope123UpdateInput.scope1And2Year,
                scope1And2Reduction: scope123UpdateInput.scope1And2Reduction,
                scope3Year: scope123UpdateInput.scope3Year,
                scope3Reduction: scope123UpdateInput.scope3Reduction,
                includeCarbonOffset: scope123UpdateInput.includeCarbonOffset,
                strategy: scope123UpdateInput.strategy,
              })
            );
            expect(result.errors).toBeUndefined();
          });

          it('should allow a SUPPLIER_EDITOR to update targets to remove scope 3', async () => {
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

            const input = {
              companyId: targetMock.companyId,
              strategy: TargetStrategyType.Moderate,
              includeCarbonOffset: true,
              scope1And2Year: 2066,
              scope1And2Reduction: 100,
              scope3Year: null,
              scope3Reduction: null,
              targetType: TargetType.Absolute,
            };

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateTargetMutation,
              variables: { input },
            });

            const targets = await connection
              .getRepository(TargetEntity)
              .find({ companyId: supplierEditorUserMock.companyId });

            expect(targets).toHaveLength(1);
            expect(targets).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  year: input.scope1And2Year,
                  reduction: input.scope1And2Reduction,
                  includeCarbonOffset: input.includeCarbonOffset,
                  strategy: input.strategy,
                }),
              ])
            );

            expect(result.data?.updateTarget).toEqual(
              expect.objectContaining({
                scope1And2Year: input.scope1And2Year,
                scope1And2Reduction: input.scope1And2Reduction,
                scope3Year: null,
                scope3Reduction: null,
                includeCarbonOffset: input.includeCarbonOffset,
                strategy: input.strategy,
              })
            );
            expect(result.errors).toBeUndefined();
          });
        });

        describe('when scope 3 target has not been set', () => {
          beforeEach(async () => {
            await connection.getRepository(TargetEntity).save(targetMock);
          });

          it('should allow a $role to update scope 1 and 2 target and create scope 3 target', async () => {
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

            const input = {
              companyId: targetMock.companyId,
              strategy: TargetStrategyType.Moderate,
              includeCarbonOffset: true,
              scope1And2Year: 2066,
              scope1And2Reduction: 100,
              scope3Year: targetScope3Mock.year,
              scope3Reduction: targetScope3Mock.reduction,
              targetType: TargetType.Absolute,
            };

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateTargetMutation,
              variables: { input },
            });

            const targets = await connection
              ?.getRepository(TargetEntity)
              .find({ companyId: supplierEditorUserMock.companyId });

            expect(targets).toHaveLength(2);
            expect(targets).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  year: input.scope1And2Year,
                  reduction: input.scope1And2Reduction,
                  includeCarbonOffset: input.includeCarbonOffset,
                  strategy: input.strategy,
                }),
                expect.objectContaining({
                  year: input.scope3Year,
                  reduction: input.scope3Reduction,
                  includeCarbonOffset: input.includeCarbonOffset,
                  strategy: input.strategy,
                }),
              ])
            );

            expect(result.data?.updateTarget).toEqual(
              expect.objectContaining({
                scope1And2Year: input.scope1And2Year,
                scope1And2Reduction: input.scope1And2Reduction,
                scope3Year: input.scope3Year,
                scope3Reduction: input.scope3Reduction,
                includeCarbonOffset: input.includeCarbonOffset,
                strategy: input.strategy,
              })
            );
            expect(result.errors).toBeUndefined();
          });
        });

        it.each`
          role
          ${RoleName.SupplierViewer}
        `(
          'should not allow $role to update a target',
          async ({ role }: { role: RoleName }) => {
            const connection = await getOrCreateConnection();
            const roleRepository = connection.getCustomRepository(
              RoleRepository
            );
            const roles = await roleRepository.findAssumedRolesForRoleName(
              role
            );
            await connection.getRepository(TargetEntity).save(targetMock);
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

            const input = {
              companyId: targetMock.companyId,
              strategy: targetMock.strategy,
              includeCarbonOffset: targetMock.includeCarbonOffset,
              scope1And2Year: targetMock.year,
              scope1And2Reduction: targetMock.reduction,
              targetType: TargetType.Absolute,
            };

            const server = getApolloServer();

            const result = await server.executeOperation({
              query: updateTargetMutation,
              variables: { input },
            });

            expect(result.data?.updateTarget).toBeUndefined;
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
        it('should NOT allow a SUPPLIER_EDITOR to update targets', async () => {
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
            query: updateTargetMutation,
            variables: { input: scope123UpdateInput },
          });

          expect(result.data?.updateTarget).toBeNull();

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

  describe('saveTargets', () => {
    const SAVE_TARGETS_MUTATION = `
      mutation ($input: SaveTargetsInput!) {
        saveTargets(input: $input) {
          success
        }
      }
    `;

    const setup = async () => {
      await connection
        .getRepository(CompanyEntity)
        .save([createCompanyMock({ id: companyId })]);

      await connection
        .getRepository(UserEntity)
        .save([
          await createUserMock(
            { id: userId, companyId },
            RoleName.SupplierEditor
          ),
        ]);

      await connection.getRepository(CorporateEmissionEntity).save([
        createCorporateEmissionMock({
          id: corporateEmissionId,
          companyId,
          year,
          type: CorporateEmissionType.Baseline,
          createdBy: userId,
          updatedBy: userId,
        }),
      ]);

      await connection.getRepository(CarbonIntensityEntity).save(
        createCarbonIntensityMock({
          id: carbonIntensityId,
          emissionId: corporateEmissionId,
          createdBy: userId,
          updatedBy: userId,
          companyId,
          year,
          intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
        })
      );
    };

    const teardown = async () => {
      await connection.getRepository(AuditEntity).delete({ userId });

      await connection.query('DELETE FROM CARBON_INTENSITY_TARGET');

      await connection.getRepository(TargetEntity).delete({
        companyId,
      });

      await connection
        .getRepository(CorporateEmissionEntity)
        .delete([corporateEmissionId]);

      await connection
        .getCustomRepository(UserRepository)
        .deleteUsers([userId]);
      await connection.getRepository(CompanyEntity).delete([companyId]);
    };

    beforeAll(async () => {
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: getCurrentUser({
          userOverrides: {
            companyId,
            id: userId,
          },
          companyOverrides: {
            id: companyId,
          },
          roles,
        }),
      }));
    });

    beforeEach(async () => {
      await teardown();
      await setup();
    });

    afterAll(async () => {
      await teardown();
    });

    it('should error when editing a company that does not belong to the user', async () => {
      const server = getApolloServer();
      const result = await server.executeOperation({
        query: SAVE_TARGETS_MUTATION,
        variables: {
          input: {
            companyId: anotherCompanyId,
            toSave: [],
          },
        },
      });
      expect(result.errors).toEqual([new ApolloError(USER_COMPANY_ERROR)]);
    });

    describe('when a user does not have a baseline emission', () => {
      beforeEach(async () => {
        await connection
          .getRepository(CorporateEmissionEntity)
          .delete([corporateEmissionId]);
      });

      it('should raise an error', async () => {
        const server = getApolloServer();
        const result = await server.executeOperation({
          query: SAVE_TARGETS_MUTATION,
          variables: {
            input: {
              companyId,
              toSave: [],
            },
          },
        });
        expect(result.errors).toEqual([new ApolloError(NO_BASELINE_ERROR)]);
      });
    });

    describe("when a target's intensity metric is not also associated to the baseline", () => {
      describe('when the baseline emission does not have carbon intensities', () => {
        it('should raise an error', async () => {
          const server = getApolloServer();

          await connection
            .getRepository(CarbonIntensityEntity)
            .delete([carbonIntensityId]);

          const variables: MutationSaveTargetsArgs = {
            input: {
              companyId,
              toSave: [
                {
                  strategy: TargetStrategyType.Moderate,
                  includeCarbonOffset: false,
                  scope1And2Year: 2042,
                  scope1And2Reduction: 40,
                  scope3Year: null,
                  scope3Reduction: null,
                  targetType: TargetType.Intensity,
                  intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
                  scope1And2PrivacyType: TargetPrivacyType.Private,
                },
              ],
            },
          };

          const result = await server.executeOperation({
            query: SAVE_TARGETS_MUTATION,
            variables,
          });
          expect(result.errors).toEqual([
            new ApolloError(INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE),
          ]);
        });
      });

      describe('when the baseline emission has carbon intensities but the metric types do not overlap', () => {
        it('should raise an error', async () => {
          const server = getApolloServer();

          const variables: MutationSaveTargetsArgs = {
            input: {
              companyId,
              toSave: [
                {
                  strategy: TargetStrategyType.Moderate,
                  includeCarbonOffset: false,
                  scope1And2Year: 2042,
                  scope1And2Reduction: 40,
                  scope3Year: null,
                  scope3Reduction: null,
                  targetType: TargetType.Intensity,
                  intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
                  scope1And2PrivacyType: TargetPrivacyType.Private,
                },
              ],
            },
          };
          const result = await server.executeOperation({
            query: SAVE_TARGETS_MUTATION,
            variables,
          });
          expect(result.errors).toEqual([
            new ApolloError(INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE),
          ]);
        });
      });
    });

    describe(`when a user attempts to submit more than ${MAX_ABSOLUTE_TARGETS_PER_COMPANY} absolute targets`, () => {
      it('should raise an error', async () => {
        const server = getApolloServer();

        const variables: MutationSaveTargetsArgs = {
          input: {
            companyId,
            toSave: [
              {
                strategy: TargetStrategyType.Moderate,
                includeCarbonOffset: false,
                scope1And2Year: 2042,
                scope1And2Reduction: 40,
                scope3Year: 2035,
                scope3Reduction: 30,
                targetType: TargetType.Absolute,
                scope1And2PrivacyType: TargetPrivacyType.Private,
              },
              {
                strategy: TargetStrategyType.Moderate,
                includeCarbonOffset: false,
                scope1And2Year: 2042,
                scope1And2Reduction: 40,
                scope3Year: 2035,
                scope3Reduction: 30,
                targetType: TargetType.Absolute,
                scope1And2PrivacyType: TargetPrivacyType.Private,
              },
            ],
          },
        };
        const result = await server.executeOperation({
          query: SAVE_TARGETS_MUTATION,
          variables,
        });

        expect(result.errors).toEqual([
          new ApolloError(MAX_ABSOLUTE_TARGETS_EXCEEDED_ERROR),
        ]);
      });
    });

    describe(`when a user attempts to submit more than ${MAX_INTENSITY_TARGETS_PER_COMPANY} intensity targets`, () => {
      it('should raise an error', async () => {
        const server = getApolloServer();
        const variables: MutationSaveTargetsArgs = {
          input: {
            companyId,
            toSave: [
              {
                strategy: TargetStrategyType.Moderate,
                includeCarbonOffset: false,
                scope1And2Year: 2042,
                scope1And2Reduction: 40,
                scope3Year: 2035,
                scope3Reduction: 30,
                targetType: TargetType.Intensity,
                intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
                scope1And2PrivacyType: TargetPrivacyType.Public,
                scope3PrivacyType: TargetPrivacyType.Public,
              },
              {
                strategy: TargetStrategyType.Aggressive,
                includeCarbonOffset: false,
                scope1And2Year: 2042,
                scope1And2Reduction: 40,
                scope3Year: 2035,
                scope3Reduction: 30,
                targetType: TargetType.Intensity,
                intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
                scope1And2PrivacyType: TargetPrivacyType.Public,
                scope3PrivacyType: TargetPrivacyType.Public,
              },
            ],
          },
        };
        const result = await server.executeOperation({
          query: SAVE_TARGETS_MUTATION,
          variables,
        });

        expect(result.errors).toEqual([
          new ApolloError(MAX_INTENSITY_TARGETS_EXCEEDED_ERROR),
        ]);
      });
    });

    describe('when a user is creating their first targets', () => {
      describe('when providing absolute data', () => {
        describe('when scope12 and scope3 data is provided', () => {
          it('should create two new TARGET records', async () => {
            const server = getApolloServer();
            const variables: MutationSaveTargetsArgs = {
              input: {
                companyId,
                toSave: [
                  {
                    strategy: TargetStrategyType.Moderate,
                    includeCarbonOffset: false,
                    scope1And2Year: 2042,
                    scope1And2Reduction: 40,
                    scope3Year: 2035,
                    scope3Reduction: 30,
                    targetType: TargetType.Absolute,
                    scope1And2PrivacyType:
                      TargetPrivacyType.ScienceBasedInitiative,
                    scope3PrivacyType: TargetPrivacyType.ScienceBasedInitiative,
                  },
                ],
              },
            };
            const result = await server.executeOperation({
              query: SAVE_TARGETS_MUTATION,
              variables,
            });

            expect(result.data?.saveTargets).toEqual({ success: true });

            const records = await connection
              .getRepository(TargetEntity)
              .find({ where: { companyId } });

            expect(records).toHaveLength(2);
            expect(records).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  companyId,
                  strategy: TargetStrategyType.Moderate,
                  targetType: TargetType.Absolute,
                  scopeType: TargetScopeType.Scope_1_2,
                  reduction: 40,
                  year: 2042,
                }),
                expect.objectContaining({
                  companyId,
                  strategy: TargetStrategyType.Moderate,
                  targetType: TargetType.Absolute,
                  scopeType: TargetScopeType.Scope_3,
                  reduction: 30,
                  year: 2035,
                }),
              ])
            );
          });
        });

        describe('when scope12 data is provided, and scope3 data is not', () => {
          it('should create one new TARGET record', async () => {
            const server = getApolloServer();
            const variables: MutationSaveTargetsArgs = {
              input: {
                companyId,
                toSave: [
                  {
                    strategy: TargetStrategyType.Moderate,
                    includeCarbonOffset: false,
                    scope1And2Year: 2042,
                    scope1And2Reduction: 40,
                    scope3Year: null,
                    scope3Reduction: null,
                    targetType: TargetType.Absolute,
                    scope1And2PrivacyType: TargetPrivacyType.Public,
                    scope3PrivacyType: null,
                  },
                ],
              },
            };
            const result = await server.executeOperation({
              query: SAVE_TARGETS_MUTATION,
              variables,
            });

            expect(result.data?.saveTargets).toEqual({ success: true });

            const records = await connection
              .getRepository(TargetEntity)
              .find({ where: { companyId } });

            expect(records).toHaveLength(1);
            expect(records).toEqual([
              expect.objectContaining({
                companyId,
                strategy: TargetStrategyType.Moderate,
                targetType: TargetType.Absolute,
                scopeType: TargetScopeType.Scope_1_2,
                reduction: 40,
                year: 2042,
              }),
            ]);
          });
        });
      });

      describe('when providing intensity data', () => {
        describe('when scope12 and scope3 data is provided', () => {
          it('should create two TARGET records', async () => {
            const server = getApolloServer();
            const variables: MutationSaveTargetsArgs = {
              input: {
                companyId,
                toSave: [
                  {
                    strategy: TargetStrategyType.Moderate,
                    includeCarbonOffset: false,
                    scope1And2Year: 2042,
                    scope1And2Reduction: 40,
                    scope3Year: 2050,
                    scope3Reduction: 60,
                    targetType: TargetType.Intensity,
                    intensityMetric:
                      CarbonIntensityMetricType.NumberOfEmployees,
                    scope1And2PrivacyType: TargetPrivacyType.Public,
                    scope3PrivacyType: TargetPrivacyType.Public,
                  },
                ],
              },
            };
            const result = await server.executeOperation({
              query: SAVE_TARGETS_MUTATION,
              variables,
            });

            expect(result.data?.saveTargets).toEqual({ success: true });

            const records = await connection
              .getRepository(TargetEntity)
              .find({ where: { companyId } });

            expect(records).toHaveLength(2);
            expect(records).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  companyId,
                  strategy: TargetStrategyType.Moderate,
                  targetType: TargetType.Intensity,
                  scopeType: TargetScopeType.Scope_1_2,
                  reduction: 40,
                  year: 2042,
                }),
                expect.objectContaining({
                  companyId,
                  strategy: TargetStrategyType.Moderate,
                  targetType: TargetType.Intensity,
                  scopeType: TargetScopeType.Scope_3,
                  reduction: 60,
                  year: 2050,
                }),
              ])
            );
          });
        });

        describe('when scope12 data is provided, and scope3 data is not', () => {
          it('should create one new TARGET record', async () => {
            const server = getApolloServer();
            const variables: MutationSaveTargetsArgs = {
              input: {
                companyId,
                toSave: [
                  {
                    strategy: TargetStrategyType.Moderate,
                    includeCarbonOffset: false,
                    scope1And2Year: 2042,
                    scope1And2Reduction: 40,
                    scope3Year: null,
                    scope3Reduction: null,
                    targetType: TargetType.Intensity,
                    intensityMetric:
                      CarbonIntensityMetricType.NumberOfEmployees,
                    scope1And2PrivacyType: TargetPrivacyType.Public,
                    scope3PrivacyType: TargetPrivacyType.Public,
                  },
                ],
              },
            };
            const result = await server.executeOperation({
              query: SAVE_TARGETS_MUTATION,
              variables,
            });

            expect(result.data?.saveTargets).toEqual({ success: true });

            const records = await connection
              .getRepository(TargetEntity)
              .find({ where: { companyId } });

            expect(records).toHaveLength(1);
            expect(records).toEqual([
              expect.objectContaining({
                companyId,
                strategy: TargetStrategyType.Moderate,
                targetType: TargetType.Intensity,
                scopeType: TargetScopeType.Scope_1_2,
                reduction: 40,
                year: 2042,
              }),
            ]);
          });
        });

        describe('carbon intensity data', () => {
          it('should associate a CARBON INTENSITY TARGET record with the scope_1_2 TARGET', async () => {
            const server = getApolloServer();
            const variables: MutationSaveTargetsArgs = {
              input: {
                companyId,
                toSave: [
                  {
                    strategy: TargetStrategyType.Moderate,
                    includeCarbonOffset: false,
                    scope1And2Year: 2042,
                    scope1And2Reduction: 40,
                    scope3Year: 2050,
                    scope3Reduction: 60,
                    targetType: TargetType.Intensity,
                    intensityMetric:
                      CarbonIntensityMetricType.NumberOfEmployees,
                    scope1And2PrivacyType: TargetPrivacyType.Public,
                    scope3PrivacyType: TargetPrivacyType.Public,
                  },
                ],
              },
            };
            const result = await server.executeOperation({
              query: SAVE_TARGETS_MUTATION,
              variables,
            });

            expect(result.data?.saveTargets).toEqual({ success: true });

            const records = await connection
              .getRepository(TargetEntity)
              .find({ where: { companyId }, relations: ['carbonIntensities'] });

            expect(records).toHaveLength(2);

            const scope12Target = records.find(
              (record) => record.scopeType === TargetScopeType.Scope_1_2
            );

            const scope3Target = records.find(
              (record) => record.scopeType === TargetScopeType.Scope_3
            );

            expect(scope12Target?.carbonIntensities).toEqual([
              expect.objectContaining({
                intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
                companyId,
                emissionId: corporateEmissionId,
              }),
            ]);

            expect(scope3Target?.carbonIntensities).toEqual([]);
          });
        });
      });
    });

    describe('when a user is editing targets', () => {
      describe('when a user has previously saved scope12 & scope 3 data', () => {
        beforeEach(async () => {
          await connection.getRepository(TargetEntity).save([
            createTargetMock({
              id: absoluteTargetScope12Id,
              companyId,
              createdBy: userId,
              updatedBy: userId,
              year: 2040,
              reduction: 50,
              strategy: TargetStrategyType.Aggressive,
              targetType: TargetType.Absolute,
              scopeType: TargetScopeType.Scope_1_2,
            }),
            createTargetMock({
              id: absoluteTargetScope3Id,
              companyId,
              createdBy: userId,
              updatedBy: userId,
              year: 2040,
              reduction: 70,
              strategy: TargetStrategyType.Aggressive,
              targetType: TargetType.Absolute,
              scopeType: TargetScopeType.Scope_3,
            }),
          ]);
        });

        describe('when scope3Year and scope3Reduction are null', () => {
          it('should delete the scope3 target record', async () => {
            const server = getApolloServer();
            const variables: MutationSaveTargetsArgs = {
              input: {
                companyId,
                toSave: [
                  {
                    strategy: TargetStrategyType.Moderate,
                    includeCarbonOffset: false,
                    scope1And2Year: 2042,
                    scope1And2Reduction: 40,
                    scope3Year: null,
                    scope3Reduction: null,
                    targetType: TargetType.Absolute,
                    intensityMetric:
                      CarbonIntensityMetricType.NumberOfEmployees,
                    scope1And2PrivacyType: TargetPrivacyType.Private,
                    scope3PrivacyType: null,
                  },
                ],
              },
            };
            const result = await server.executeOperation({
              query: SAVE_TARGETS_MUTATION,
              variables,
            });

            expect(result.data?.saveTargets).toEqual({ success: true });

            const records = await connection
              .getRepository(TargetEntity)
              .find({ where: { companyId } });

            expect(records).toHaveLength(1);

            expect(records).toEqual([
              expect.objectContaining({
                companyId,
                strategy: TargetStrategyType.Moderate,
                targetType: TargetType.Absolute,
                scopeType: TargetScopeType.Scope_1_2,
                reduction: 40,
                year: 2042,
              }),
            ]);
          });
        });

        describe('when scope3Year and scope3Reduction values are passed', () => {
          describe('when values have changed', () => {
            it('should update the existing scope3 record', async () => {
              const server = getApolloServer();
              const variables: MutationSaveTargetsArgs = {
                input: {
                  companyId,
                  toSave: [
                    {
                      strategy: TargetStrategyType.Aggressive,
                      includeCarbonOffset: false,
                      scope1And2Year: 2042,
                      scope1And2Reduction: 40,
                      scope3Year: 2028,
                      scope3Reduction: 30,
                      targetType: TargetType.Absolute,
                      intensityMetric:
                        CarbonIntensityMetricType.NumberOfEmployees,
                      scope1And2PrivacyType:
                        TargetPrivacyType.ScienceBasedInitiative,
                      scope3PrivacyType:
                        TargetPrivacyType.ScienceBasedInitiative,
                    },
                  ],
                },
              };
              const result = await server.executeOperation({
                query: SAVE_TARGETS_MUTATION,
                variables,
              });

              expect(result.data?.saveTargets).toEqual({ success: true });

              const records = await connection
                .getRepository(TargetEntity)
                .find({ where: { companyId } });

              expect(records).toHaveLength(2);

              expect(records).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    companyId,
                    strategy: TargetStrategyType.Aggressive,
                    targetType: TargetType.Absolute,
                    scopeType: TargetScopeType.Scope_1_2,
                    reduction: 40,
                    year: 2042,
                  }),
                  expect.objectContaining({
                    companyId,
                    strategy: TargetStrategyType.Aggressive,
                    targetType: TargetType.Absolute,
                    scopeType: TargetScopeType.Scope_3,
                    reduction: 30,
                    year: 2028,
                  }),
                ])
              );
            });
          });
        });

        describe('when scope12 values have changed', () => {
          it('should update the scope12 record', async () => {
            const server = getApolloServer();
            const variables: MutationSaveTargetsArgs = {
              input: {
                companyId,
                toSave: [
                  {
                    strategy: TargetStrategyType.Passive,
                    includeCarbonOffset: true,
                    scope1And2Year: 2035,
                    scope1And2Reduction: 50,
                    scope3Year: null,
                    scope3Reduction: null,
                    targetType: TargetType.Absolute,
                    intensityMetric:
                      CarbonIntensityMetricType.NumberOfEmployees,
                    scope1And2PrivacyType: TargetPrivacyType.Public,
                    scope3PrivacyType: null,
                  },
                ],
              },
            };
            const result = await server.executeOperation({
              query: SAVE_TARGETS_MUTATION,
              variables,
            });

            expect(result.data?.saveTargets).toEqual({ success: true });

            const records = await connection
              .getRepository(TargetEntity)
              .find({ where: { companyId } });

            expect(records).toHaveLength(1);

            expect(records).toEqual([
              expect.objectContaining({
                companyId,
                strategy: TargetStrategyType.Passive,
                targetType: TargetType.Absolute,
                scopeType: TargetScopeType.Scope_1_2,
                reduction: 50,
                year: 2035,
                includeCarbonOffset: true,
              }),
            ]);
          });
        });
      });

      describe('when a user edits their carbon intensity metric', () => {
        beforeEach(async () => {
          await connection.getRepository(TargetEntity).save([
            createTargetMock({
              id: intensityTargetScope12Id,
              companyId,
              createdBy: userId,
              updatedBy: userId,
              year: 2040,
              reduction: 50,
              strategy: TargetStrategyType.Aggressive,
              targetType: TargetType.Intensity,
              scopeType: TargetScopeType.Scope_1_2,
            }),
          ]);
          await connection.query(
            'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1)',
            [carbonIntensityId, intensityTargetScope12Id]
          );
        });

        it('should overwrite the previous CARBON_INTENSITY_TARGET', async () => {
          await connection.getRepository(CarbonIntensityEntity).save([
            createCarbonIntensityMock({
              id: carbonIntensityId,
              emissionId: corporateEmissionId,
              companyId,
              createdBy: userId,
              updatedBy: userId,
              intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            }),
          ]);

          const server = getApolloServer();
          const variables: MutationSaveTargetsArgs = {
            input: {
              companyId,
              toSave: [
                {
                  strategy: TargetStrategyType.Passive,
                  includeCarbonOffset: true,
                  scope1And2Year: 2035,
                  scope1And2Reduction: 50,
                  scope3Year: null,
                  scope3Reduction: null,
                  targetType: TargetType.Intensity,
                  intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
                  scope1And2PrivacyType: TargetPrivacyType.Private,
                  scope3PrivacyType: null,
                },
              ],
            },
          };
          await server.executeOperation({
            query: SAVE_TARGETS_MUTATION,
            variables,
          });

          const records = await connection
            .getRepository(TargetEntity)
            .find({ where: { companyId }, relations: ['carbonIntensities'] });

          expect(records).toHaveLength(1);

          expect(records).toEqual([
            expect.objectContaining({
              companyId,
              strategy: TargetStrategyType.Passive,
              targetType: TargetType.Intensity,
              scopeType: TargetScopeType.Scope_1_2,
              reduction: 50,
              year: 2035,
              includeCarbonOffset: true,
              carbonIntensities: [
                expect.objectContaining({
                  intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
                }),
              ],
            }),
          ]);
        });
      });
    });

    describe('auditing', () => {
      describe('creates', () => {
        describe('when creating absolute + intensity records', () => {
          describe('when creating scope1_2 + scope3 records', () => {
            it('should create 4 audit records', async () => {
              const server = getApolloServer();
              const variables: MutationSaveTargetsArgs = {
                input: {
                  companyId,
                  toSave: [
                    {
                      strategy: TargetStrategyType.Moderate,
                      includeCarbonOffset: false,
                      scope1And2Year: 2042,
                      scope1And2Reduction: 40,
                      scope3Year: 2035,
                      scope3Reduction: 30,
                      targetType: TargetType.Absolute,
                      scope1And2PrivacyType:
                        TargetPrivacyType.ScienceBasedInitiative,
                      scope3PrivacyType:
                        TargetPrivacyType.ScienceBasedInitiative,
                    },
                    {
                      strategy: TargetStrategyType.Aggressive,
                      includeCarbonOffset: false,
                      scope1And2Year: 2042,
                      scope1And2Reduction: 40,
                      scope3Year: 2035,
                      scope3Reduction: 30,
                      targetType: TargetType.Intensity,
                      intensityMetric:
                        CarbonIntensityMetricType.NumberOfEmployees,
                      scope1And2PrivacyType:
                        TargetPrivacyType.ScienceBasedInitiative,
                      scope3PrivacyType:
                        TargetPrivacyType.ScienceBasedInitiative,
                    },
                  ],
                },
              };
              await server.executeOperation({
                query: SAVE_TARGETS_MUTATION,
                variables,
              });

              const auditRecords = await connection
                .getRepository(AuditEntity)
                .find({ where: { userId } });

              expect(auditRecords).toHaveLength(4);

              expect(auditRecords).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({ action: TARGET_CREATED_ACTION }),
                  expect.objectContaining({ action: TARGET_CREATED_ACTION }),
                  expect.objectContaining({ action: TARGET_CREATED_ACTION }),
                  expect.objectContaining({ action: TARGET_CREATED_ACTION }),
                ])
              );
            });
          });
        });
      });

      describe('updates', () => {
        describe('when a user has an existing target', () => {
          beforeEach(async () => {
            await connection.getRepository(TargetEntity).save([
              createTargetMock({
                id: intensityTargetScope12Id,
                companyId,
                createdBy: userId,
                updatedBy: userId,
                year: 2042,
                reduction: 40,
                strategy: TargetStrategyType.Moderate,
                targetType: TargetType.Intensity,
                scopeType: TargetScopeType.Scope_1_2,
                privacyType: TargetPrivacyType.ScienceBasedInitiative,
              }),
            ]);
            await connection.query(
              'INSERT INTO "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id") VALUES (@0, @1)',
              [carbonIntensityId, intensityTargetScope12Id]
            );
          });

          describe('when a user changes edits their target data', () => {
            it('should create a TARGET_UPDATED audit record', async () => {
              const server = getApolloServer();
              const variables: MutationSaveTargetsArgs = {
                input: {
                  companyId,
                  toSave: [
                    {
                      strategy: TargetStrategyType.Aggressive,
                      includeCarbonOffset: true,
                      scope1And2Year: 2052,
                      scope1And2Reduction: 50,
                      scope3Year: null,
                      scope3Reduction: null,
                      targetType: TargetType.Intensity,
                      intensityMetric:
                        CarbonIntensityMetricType.NumberOfEmployees,
                      scope1And2PrivacyType:
                        TargetPrivacyType.ScienceBasedInitiative,
                      scope3PrivacyType: null,
                    },
                  ],
                },
              };
              await server.executeOperation({
                query: SAVE_TARGETS_MUTATION,
                variables,
              });

              const auditRecords = await connection
                .getRepository(AuditEntity)
                .find({ where: { userId } });

              expect(auditRecords).toHaveLength(1);

              expect(auditRecords).toEqual([
                expect.objectContaining({ action: TARGET_UPDATED_ACTION }),
              ]);
            });

            it('should store the changes in the previous payload field', async () => {
              const server = getApolloServer();
              const variables: MutationSaveTargetsArgs = {
                input: {
                  companyId,
                  toSave: [
                    {
                      strategy: TargetStrategyType.Aggressive,
                      includeCarbonOffset: true,
                      scope1And2Year: 2052,
                      scope1And2Reduction: 50,
                      scope3Year: null,
                      scope3Reduction: null,
                      targetType: TargetType.Intensity,
                      intensityMetric:
                        CarbonIntensityMetricType.NumberOfEmployees,
                      scope1And2PrivacyType: TargetPrivacyType.Public,
                      scope3PrivacyType: null,
                    },
                  ],
                },
              };
              await server.executeOperation({
                query: SAVE_TARGETS_MUTATION,
                variables,
              });
              const auditRecords = await connection
                .getRepository(AuditEntity)
                .find({ where: { userId } });

              expect(auditRecords).toHaveLength(1);

              const [
                { previousPayload: previousPayloadStringified },
              ] = auditRecords;

              const previousPayload = JSON.parse(
                previousPayloadStringified as string
              );

              expect(previousPayload).toEqual(
                expect.objectContaining({
                  id: intensityTargetScope12Id,
                  includeCarbonOffset: true,
                  reduction: 50,
                  strategy: TargetStrategyType.Aggressive,
                  year: 2052,
                  privacyType: TargetPrivacyType.Public,
                })
              );
            });
          });
        });
      });

      describe('deletes', () => {
        describe('when a user has existing scope3 records', () => {
          beforeEach(async () => {
            await connection.getRepository(TargetEntity).save([
              createTargetMock({
                id: absoluteTargetScope12Id,
                companyId,
                createdBy: userId,
                updatedBy: userId,
                year: 2042,
                reduction: 40,
                strategy: TargetStrategyType.Moderate,
                targetType: TargetType.Absolute,
                scopeType: TargetScopeType.Scope_1_2,
                privacyType: TargetPrivacyType.Private,
              }),
              createTargetMock({
                id: absoluteTargetScope3Id,
                companyId,
                createdBy: userId,
                updatedBy: userId,
                year: 2040,
                reduction: 70,
                strategy: TargetStrategyType.Moderate,
                targetType: TargetType.Absolute,
                scopeType: TargetScopeType.Scope_3,
                privacyType: TargetPrivacyType.Private,
              }),
            ]);
          });

          describe('when a user sends null values for scope3Reduction and scope3Year', () => {
            it('should create a TARGET_DELETED audit record', async () => {
              const server = getApolloServer();
              const variables: MutationSaveTargetsArgs = {
                input: {
                  companyId,
                  toSave: [
                    {
                      strategy: TargetStrategyType.Moderate,
                      includeCarbonOffset: false,
                      scope1And2Year: 2042,
                      scope1And2Reduction: 40,
                      scope3Year: null,
                      scope3Reduction: null,
                      targetType: TargetType.Absolute,
                      scope1And2PrivacyType: TargetPrivacyType.Private,
                      scope3PrivacyType: TargetPrivacyType.Private,
                    },
                  ],
                },
              };
              await server.executeOperation({
                query: SAVE_TARGETS_MUTATION,
                variables,
              });

              const auditRecords = await connection
                .getRepository(AuditEntity)
                .find({ where: { userId } });

              expect(auditRecords).toHaveLength(1);

              expect(auditRecords).toEqual([
                expect.objectContaining({ action: TARGET_DELETED_ACTION }),
              ]);
            });
          });
        });
      });
    });
  });
});
