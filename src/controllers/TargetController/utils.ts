import { ApolloError } from 'apollo-server-express';
import { TargetEntity } from '../../entities/Target';
import {
  AbsoluteTarget,
  CarbonIntensityMetricType,
  IntensityTarget,
  TargetScopeType,
  TargetType,
} from '../../types';
import { TARGET_SCOPE_3_FIELDS_INVALID } from './constants';

interface Scope3DataArgs {
  scope3Year?: number | null;
  scope3Reduction?: number | null;
}

export const isScope3Valid = ({
  scope3Year,
  scope3Reduction,
}: Scope3DataArgs) =>
  (typeof scope3Reduction === 'number' && typeof scope3Year === 'number') ||
  (typeof scope3Reduction !== 'number' && typeof scope3Year !== 'number');

export const isScope3DataTruthy = ({
  scope3Year,
  scope3Reduction,
}: Scope3DataArgs) =>
  typeof scope3Reduction === 'number' && typeof scope3Year === 'number';

export interface TargetScopePair {
  scope1And2Target: TargetEntity;
  scope3Target?: TargetEntity;
}

export const mergeTargetData = ({
  scope1And2Target,
  scope3Target,
}: TargetScopePair): AbsoluteTarget => {
  return {
    scope1And2Year: scope1And2Target.year,
    scope1And2Reduction: scope1And2Target.reduction,
    scope3Year: scope3Target?.year,
    scope3Reduction: scope3Target?.reduction,
    strategy: scope1And2Target.strategy,
    includeCarbonOffset: scope1And2Target.includeCarbonOffset,
    scope1And2PrivacyType: scope1And2Target.privacyType,
    scope3PrivacyType: scope3Target?.privacyType,
    companyId: scope1And2Target.companyId,
  };
};

export const pairTargets = (targets: TargetEntity[]) => {
  return targets.reduce(
    (output: TargetScopePair[], target: TargetEntity): TargetScopePair[] => {
      if (target.scopeType === TargetScopeType.Scope_3) {
        return output;
      }

      const scope3Target = targets.find(
        (t2) =>
          t2.scopeType === TargetScopeType.Scope_3 &&
          t2.targetType === target.targetType &&
          t2.companyId === target.companyId
      );

      return [...output, { scope1And2Target: target, scope3Target }];
    },
    []
  );
};

export const targetPairsToIntensityTargetData = (
  targets: IntensityTarget[],
  { scope1And2Target, scope3Target }: TargetScopePair
) => {
  const carbonIntensities = scope1And2Target.carbonIntensities;
  if (!carbonIntensities?.length) {
    return targets;
  }

  const targetsJoinedWithIntensities = carbonIntensities.map(
    (carbonIntensity) =>
      ({
        ...mergeTargetData({
          scope1And2Target,
          scope3Target,
        }),
        intensityMetric: carbonIntensity.intensityMetric,
        intensityValue: carbonIntensity.intensityValue,
      } as IntensityTarget)
  );

  return [...targets, ...targetsJoinedWithIntensities];
};

export const metricInList = (
  metricList: CarbonIntensityMetricType[] = [],
  metric?: CarbonIntensityMetricType | null
) => metric && metricList.includes(metric);

export const isScope12Target = (target: TargetEntity) =>
  target.scopeType === TargetScopeType.Scope_1_2;

export const isScope3Target = (target: TargetEntity) =>
  target.scopeType === TargetScopeType.Scope_3;

export const validateScope3ValuesOrFail = <
  T extends { scope3Reduction?: number | null; scope3Year?: number | null }
>({
  scope3Reduction,
  scope3Year,
}: T) => {
  if (!isScope3Valid({ scope3Reduction, scope3Year })) {
    throw new ApolloError(TARGET_SCOPE_3_FIELDS_INVALID);
  }
};

export const preExistingTargetTypeForCompany = (type: TargetType) =>
  `An ${type} ambition type already exists for the company.`;
