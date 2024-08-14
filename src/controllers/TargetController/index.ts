import { Repository } from 'typeorm';
import { ApolloError } from 'apollo-server-express';
import {
  CreateTargetInput,
  AbsoluteTarget,
  TargetStrategyType,
  TargetScopeType,
  UpdateTargetInput,
  TargetType,
  SaveTargetsInput,
  Targets,
  SimpleSuccess,
  TargetPrivacyType,
} from '../../types';
import { ControllerFunction, ControllerFunctionAsync } from '../types';

import { TargetEntity } from '../../entities/Target';
import { logger } from '../../utils/logger';
import {
  AuditActionType,
  TARGET_CREATED_ACTION,
  TARGET_DELETED_ACTION,
  TARGET_UPDATED_ACTION,
} from '../../constants/audit';
import { AuditTrailInput } from '../AuditController';
import {
  mergeTargetData,
  metricInList,
  isScope12Target,
  validateScope3ValuesOrFail,
  isScope3DataTruthy,
  isScope3Target,
  preExistingTargetTypeForCompany,
} from './utils';
import { TargetsToSaveByTargetType } from './types';
import {
  INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE,
  MAX_ABSOLUTE_TARGETS_EXCEEDED_ERROR,
  MAX_INTENSITY_TARGETS_EXCEEDED_ERROR,
  TARGET_DOESNT_EXIST,
  TARGET_NOT_SAVED,
  INTENSITY_TARGET_MISSING_REQUIRED_FIELD,
  MAX_INTENSITY_TARGETS_PER_COMPANY,
  MAX_ABSOLUTE_TARGETS_PER_COMPANY,
  NO_BASELINE_ERROR,
} from './constants';
import { entityUpdatesTracker } from '../../utils/entityUpdatesTracker';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import { CompanyPrivacyService } from '../../services/CompanyPrivacyService';
import { TargetService } from '../../services/TargetService';

export class TargetController {
  constructor(
    private targetRepository: Repository<TargetEntity>,
    private companyPrivacyService: CompanyPrivacyService,
    private targetService: TargetService
  ) {}

  findAbsoluteTargetByCompanyId: ControllerFunctionAsync<
    { companyId: string },
    AbsoluteTarget | undefined
  > = async (args, context) => {
    if (context.user.companyId !== args.companyId) {
      const {
        hasAccess,
      } = await this.companyPrivacyService.hasAccessToCompanyData(
        context.user.companyId,
        args.companyId
      );
      if (!hasAccess) {
        return undefined;
      }
    }

    const targets = await this.targetRepository.find({
      where: { companyId: args.companyId, targetType: TargetType.Absolute },
    });

    const scope1And2Target = targets.find(
      (e) => e.scopeType === TargetScopeType.Scope_1_2
    );

    let scope3Target = targets.find(
      (e) => e.scopeType === TargetScopeType.Scope_3
    );

    if (!scope1And2Target) {
      return undefined;
    }

    if (context.user.companyId !== args.companyId) {
      if (scope1And2Target.privacyType === TargetPrivacyType.Private) {
        return undefined;
      }
      if (scope3Target?.privacyType === TargetPrivacyType.Private) {
        scope3Target = undefined;
      }
    }

    return mergeTargetData({ scope1And2Target, scope3Target });
  };

  findTargetsByCompanyId: ControllerFunctionAsync<
    { companyId: string },
    Targets
  > = async ({ companyId }, context) => {
    if (context.user.companyId === companyId) {
      return this.targetService.findMyTargets(companyId);
    }
    return this.targetService.findTargetsByCompanyId(
      companyId,
      context.user.companyId
    );
  };

  createTarget: ControllerFunctionAsync<
    CreateTargetInput,
    AbsoluteTarget
  > = async (args, context) => {
    const { scope3Year, scope3Reduction } = args;

    validateScope3ValuesOrFail({ scope3Reduction, scope3Year });

    if (context.user.companyId !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const targets = await this.targetRepository.find({
      where: { companyId: args.companyId, targetType: args.targetType },
    });

    if (targets.length > 0) {
      throw new ApolloError(preExistingTargetTypeForCompany(args.targetType));
    }

    return this.saveTargets({ ...args, targets }, context);
  };

  updateTarget: ControllerFunctionAsync<
    UpdateTargetInput,
    AbsoluteTarget
  > = async (args, context) => {
    if (context.user.companyId !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const { scope3Year, scope3Reduction } = args;

    validateScope3ValuesOrFail({ scope3Reduction, scope3Year });

    const targets = await this.targetRepository.find({
      where: { companyId: args.companyId },
    });

    if (targets.length === 0) {
      throw new ApolloError(TARGET_DOESNT_EXIST);
    }

    return this.saveTargets({ ...args, targets }, context);
  };

  saveTargets: ControllerFunctionAsync<
    { targets: TargetEntity[] } & (UpdateTargetInput | CreateTargetInput),
    AbsoluteTarget
  > = async (args, context) => {
    const scope1And2Values = this.getTargetValues(
      {
        scopeType: TargetScopeType.Scope_1_2,
        targets: args.targets,
        year: args.scope1And2Year,
        reduction: args.scope1And2Reduction,
        strategy: args.strategy,
        includeCarbonOffset: args.includeCarbonOffset,
        companyId: args.companyId,
        targetType: args.targetType,
      },
      context
    );

    const scope3Values = this.getTargetValues(
      {
        scopeType: TargetScopeType.Scope_3,
        targets: args.targets,
        year: args.scope3Year,
        reduction: args.scope3Reduction,
        strategy: args.strategy,
        includeCarbonOffset: args.includeCarbonOffset,
        companyId: args.companyId,
        targetType: args.targetType,
      },
      context
    );

    if (!scope1And2Values) {
      throw new ApolloError(TARGET_NOT_SAVED);
    }

    await this.targetRepository.manager.transaction(async (entityManager) => {
      if (scope1And2Values?.target) {
        await entityManager.save(scope1And2Values.target);
      }
      if (
        scope3Values?.target &&
        scope3Values?.auditTrail.action !== TARGET_DELETED_ACTION
      ) {
        await entityManager.save(scope3Values.target);
      } else if (
        scope3Values?.target &&
        scope3Values?.auditTrail.action === TARGET_DELETED_ACTION
      ) {
        await entityManager.delete(TargetEntity, {
          id: scope3Values.target.id,
        });
      }
    });

    context.controllers.audit.saveAuditTrail(
      scope1And2Values.auditTrail,
      context
    );

    if (scope3Values?.auditTrail) {
      context.controllers.audit.saveAuditTrail(
        scope3Values.auditTrail,
        context
      );
    }

    return mergeTargetData({
      scope1And2Target: scope1And2Values?.target,
      scope3Target:
        scope3Values?.auditTrail.action === TARGET_DELETED_ACTION
          ? undefined
          : scope3Values?.target,
    });
  };

  batchSaveTargets: ControllerFunctionAsync<
    SaveTargetsInput,
    SimpleSuccess
  > = async ({ companyId, toSave }, context) => {
    const toCreate: TargetEntity[] = [];
    const toUpdate: TargetEntity[] = [];
    const toDelete: TargetEntity[] = [];
    const updatesTracker = entityUpdatesTracker<TargetEntity>();
    if (companyId !== context.user.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR, 'USER_COMPANY_ERROR');
    }

    const baselineEmission = await context.controllers.corporateEmission.findBaselineByCompanyId(
      { companyId, relations: ['carbonIntensities'] },
      context
    );

    if (!baselineEmission) {
      throw new ApolloError(NO_BASELINE_ERROR, 'NO_BASELINE_ERROR');
    }

    const { absolute, intensity } = toSave.reduce(
      (output: TargetsToSaveByTargetType, input) => {
        validateScope3ValuesOrFail(input);

        if (input?.targetType === TargetType.Absolute) {
          output.absolute.push(input);
        }

        if (input?.targetType === TargetType.Intensity) {
          output.intensity.push(input);
        }

        return output;
      },
      {
        absolute: [],
        intensity: [],
      }
    );

    const baselineIntensityMetrics = baselineEmission?.carbonIntensities.map(
      (ci) => ci.intensityMetric
    );

    intensity.forEach((intensityToSave) => {
      if (
        !metricInList(baselineIntensityMetrics, intensityToSave.intensityMetric)
      ) {
        throw new ApolloError(
          INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE,
          'INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE'
        );
      }
    });

    if (absolute.length > MAX_ABSOLUTE_TARGETS_PER_COMPANY) {
      throw new ApolloError(
        MAX_ABSOLUTE_TARGETS_EXCEEDED_ERROR,
        'MAX_ABSOLUTE_TARGETS_EXCEEDED_ERROR'
      );
    }

    if (intensity.length > MAX_INTENSITY_TARGETS_PER_COMPANY) {
      throw new ApolloError(
        MAX_INTENSITY_TARGETS_EXCEEDED_ERROR,
        'MAX_INTENSITY_TARGETS_EXCEEDED_ERROR'
      );
    }

    const [
      existingAbsoluteTargets,
      existingIntensityTargets,
    ] = await Promise.all([
      this.targetRepository.find({
        where: { companyId, targetType: TargetType.Absolute },
      }),
      this.targetRepository.find({
        where: { companyId, targetType: TargetType.Intensity },
        relations: ['carbonIntensities'],
      }),
    ]);

    absolute.forEach(
      ({
        scope1And2Year,
        scope1And2Reduction,
        includeCarbonOffset,
        strategy,
        scope3Year,
        scope3Reduction,
        scope1And2PrivacyType,
        scope3PrivacyType,
      }) => {
        if (!existingAbsoluteTargets.length) {
          toCreate.push(
            new TargetEntity({
              companyId,
              reduction: scope1And2Reduction,
              year: scope1And2Year,
              includeCarbonOffset,
              strategy,
              createdBy: context.user.id,
              updatedBy: context.user.id,
              scopeType: TargetScopeType.Scope_1_2,
              targetType: TargetType.Absolute,
              privacyType: scope1And2PrivacyType,
            })
          );
          if (scope3Year && scope3Reduction && scope3PrivacyType) {
            toCreate.push(
              new TargetEntity({
                companyId,
                reduction: scope3Reduction,
                year: scope3Year,
                includeCarbonOffset,
                strategy,
                createdBy: context.user.id,
                updatedBy: context.user.id,
                scopeType: TargetScopeType.Scope_3,
                targetType: TargetType.Absolute,
                privacyType: scope3PrivacyType,
              })
            );
          }
        } else {
          const scope12Absolute = existingAbsoluteTargets.find(isScope12Target);
          const scope3Absolute = existingAbsoluteTargets.find(isScope3Target);

          if (
            scope12Absolute?.editableFieldsHaveChanged({
              year: scope1And2Year,
              reduction: scope1And2Reduction,
              includeCarbonOffset,
              strategy,
              privacyType: scope1And2PrivacyType,
            })
          ) {
            updatesTracker.track(scope12Absolute.id, scope12Absolute);
            scope12Absolute.year = scope1And2Year;
            scope12Absolute.reduction = scope1And2Reduction;
            scope12Absolute.includeCarbonOffset = includeCarbonOffset;
            scope12Absolute.strategy = strategy;
            scope12Absolute.privacyType = scope1And2PrivacyType;
            toUpdate.push(scope12Absolute);
          }

          if (
            !scope3Absolute &&
            scope3Year &&
            scope3Reduction &&
            scope3PrivacyType
          ) {
            toCreate.push(
              new TargetEntity({
                companyId,
                reduction: scope3Reduction,
                year: scope3Year,
                includeCarbonOffset,
                strategy,
                createdBy: context.user.id,
                updatedBy: context.user.id,
                scopeType: TargetScopeType.Scope_3,
                targetType: TargetType.Absolute,
                privacyType: scope3PrivacyType,
              })
            );
          } else if (
            scope3Absolute &&
            scope3Year &&
            scope3Reduction &&
            scope3PrivacyType &&
            scope3Absolute?.editableFieldsHaveChanged({
              year: scope3Year,
              reduction: scope3Reduction,
              includeCarbonOffset,
              strategy,
              privacyType: scope3PrivacyType,
            })
          ) {
            updatesTracker.track(scope3Absolute.id, scope3Absolute);
            scope3Absolute.year = scope3Year;
            scope3Absolute.reduction = scope3Reduction;
            scope3Absolute.includeCarbonOffset = includeCarbonOffset;
            scope3Absolute.strategy = strategy;
            scope3Absolute.privacyType = scope3PrivacyType;
            toUpdate.push(scope3Absolute);
          } else if (
            scope3Absolute &&
            !isScope3DataTruthy({ scope3Reduction, scope3Year })
          ) {
            toDelete.push(scope3Absolute);
          }
        }
      }
    );

    intensity.forEach(
      ({
        scope1And2Year,
        scope1And2Reduction,
        includeCarbonOffset,
        strategy,
        scope3Year,
        scope3Reduction,
        intensityMetric,
        scope1And2PrivacyType,
        scope3PrivacyType,
      }) => {
        if (!intensityMetric) {
          throw new ApolloError(
            INTENSITY_TARGET_MISSING_REQUIRED_FIELD,
            'INTENSITY_TARGET_MISSING_REQUIRED_FIELD'
          );
        }

        const carbonIntensity = baselineEmission?.carbonIntensities.find(
          (ci) => ci.intensityMetric === intensityMetric
        );

        if (!carbonIntensity) {
          throw new ApolloError(
            INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE,
            'INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE'
          );
        }

        if (!existingIntensityTargets.length) {
          toCreate.push(
            new TargetEntity({
              companyId,
              reduction: scope1And2Reduction,
              year: scope1And2Year,
              includeCarbonOffset,
              strategy,
              createdBy: context.user.id,
              updatedBy: context.user.id,
              scopeType: TargetScopeType.Scope_1_2,
              targetType: TargetType.Intensity,
              carbonIntensities: [carbonIntensity],
              privacyType: scope1And2PrivacyType,
            })
          );
          if (scope3Year && scope3Reduction && scope3PrivacyType) {
            toCreate.push(
              new TargetEntity({
                companyId,
                reduction: scope3Reduction,
                year: scope3Year,
                includeCarbonOffset,
                strategy,
                createdBy: context.user.id,
                updatedBy: context.user.id,
                scopeType: TargetScopeType.Scope_3,
                targetType: TargetType.Intensity,
                privacyType: scope3PrivacyType,
              })
            );
          }
        } else {
          const scope12Intensity = existingIntensityTargets.find(
            isScope12Target
          );
          const scope3Intensity = existingIntensityTargets.find(isScope3Target);

          const fieldsHaveChanged =
            scope12Intensity?.editableFieldsHaveChanged({
              year: scope1And2Year,
              reduction: scope1And2Reduction,
              includeCarbonOffset,
              strategy,
              privacyType: scope1And2PrivacyType,
            }) ||
            scope12Intensity?.carbonIntensitiesHaveChanged([intensityMetric]);

          if (scope12Intensity && fieldsHaveChanged) {
            updatesTracker.track(scope12Intensity.id, scope12Intensity);
            scope12Intensity.year = scope1And2Year;
            scope12Intensity.reduction = scope1And2Reduction;
            scope12Intensity.includeCarbonOffset = includeCarbonOffset;
            scope12Intensity.strategy = strategy;
            scope12Intensity.carbonIntensities = [carbonIntensity];
            scope12Intensity.privacyType = scope1And2PrivacyType;
            toUpdate.push(scope12Intensity);
          }

          if (
            !scope3Intensity &&
            scope3Year &&
            scope3Reduction &&
            scope3PrivacyType
          ) {
            toCreate.push(
              new TargetEntity({
                companyId,
                reduction: scope3Reduction,
                year: scope3Year,
                includeCarbonOffset,
                strategy,
                createdBy: context.user.id,
                updatedBy: context.user.id,
                scopeType: TargetScopeType.Scope_3,
                targetType: TargetType.Intensity,
                privacyType: scope3PrivacyType,
              })
            );
          } else if (
            scope3Intensity &&
            scope3Year &&
            scope3Reduction &&
            scope3PrivacyType &&
            scope3Intensity?.editableFieldsHaveChanged({
              year: scope3Year,
              reduction: scope3Reduction,
              includeCarbonOffset,
              strategy,
              privacyType: scope3PrivacyType,
            })
          ) {
            updatesTracker.track(scope3Intensity.id, scope3Intensity);
            scope3Intensity.year = scope3Year;
            scope3Intensity.reduction = scope3Reduction;
            scope3Intensity.includeCarbonOffset = includeCarbonOffset;
            scope3Intensity.strategy = strategy;
            scope3Intensity.privacyType = scope3PrivacyType;
            toUpdate.push(scope3Intensity);
          } else if (
            scope3Intensity &&
            !isScope3DataTruthy({ scope3Reduction, scope3Year })
          ) {
            toDelete.push(scope3Intensity);
          }
        }
      }
    );

    const idsToDelete = toDelete.map((target) => target.id);

    await this.targetRepository.manager.transaction(async (entityManager) => {
      await entityManager.remove(toDelete);
      await entityManager.save([...toCreate, ...toUpdate]);

      await context.controllers.audit.saveAuditTrails(
        {
          auditTrails: [
            ...toDelete.map((target) => ({
              userId: context.user.id,
              action: TARGET_DELETED_ACTION as AuditActionType,
              currentPayload: JSON.stringify(target),
              previousPayload: JSON.stringify({ id: target.id }),
            })),
            ...toUpdate.map((target) => ({
              userId: context.user.id,
              action: TARGET_UPDATED_ACTION as AuditActionType,
              currentPayload: JSON.stringify(target),
              previousPayload: JSON.stringify({
                ...(updatesTracker.diff(target, target.id) ?? {}),
                id: target.id,
              }),
            })),
            ...toCreate.map((target) => ({
              userId: context.user.id,
              action: TARGET_CREATED_ACTION as AuditActionType,
              currentPayload: JSON.stringify(target),
            })),
          ],
          raiseExceptions: true,
        },
        context,
        entityManager
      );
    });

    logger.info(
      {
        deleted: idsToDelete,
        updated: toUpdate.map((target) => target.id),
        created: toCreate.map(({ companyId, scopeType, targetType }) => ({
          companyId,
          scopeType,
          targetType,
        })),
        user: context.user.id,
      },
      'Saved Targets'
    );

    return { success: true };
  };

  getTargetValues: ControllerFunction<
    {
      companyId: string;
      scopeType: TargetScopeType;
      targets: TargetEntity[];
      strategy: TargetStrategyType;
      includeCarbonOffset: boolean;
      targetType: TargetType;
      year?: number | null;
      reduction?: number | null;
    },
    { target: TargetEntity; auditTrail: AuditTrailInput } | undefined
  > = (
    {
      targets,
      scopeType,
      year,
      reduction,
      strategy,
      includeCarbonOffset,
      companyId,
      targetType,
    },
    context
  ) => {
    let target = targets.find((e) => e.scopeType === scopeType);

    const hasTargetScopeType = Boolean(target);
    let auditAction: AuditActionType = hasTargetScopeType
      ? TARGET_UPDATED_ACTION
      : TARGET_CREATED_ACTION;

    const previousPayload = hasTargetScopeType
      ? JSON.stringify({ ...target })
      : undefined;

    if (year && typeof reduction === 'number') {
      if (!target) {
        target = new TargetEntity();
        target.createdBy = context.user.id;
        target.companyId = companyId;
        target.scopeType = scopeType;
        target.targetType = targetType;
      }

      target.year = year;
      target.reduction = reduction;
      target.strategy = strategy;
      target.includeCarbonOffset = includeCarbonOffset;
      target.updatedBy = context.user.id;
    } else if (target) {
      auditAction = TARGET_DELETED_ACTION;
    }

    if (!target) {
      return undefined;
    }

    return {
      target,
      auditTrail: {
        userId: context.user.id,
        action: auditAction,
        previousPayload,
        currentPayload:
          auditAction === TARGET_DELETED_ACTION
            ? undefined
            : JSON.stringify(target),
      },
    };
  };
}
