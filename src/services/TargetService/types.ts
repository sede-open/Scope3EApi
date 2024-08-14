import {
  TargetPrivacyType,
  TargetScopeType,
  TargetStrategyType,
  TargetType,
} from '../../types';

export interface ITarget {
  id: string;
  strategy: TargetStrategyType;
  companyId: string;
  year: number;
  reduction: number;
  includeCarbonOffset: boolean;
  scopeType: TargetScopeType;
  targetType: TargetType;
  createdBy: string;
  updatedBy?: string;
  privacyType: TargetPrivacyType;
}
