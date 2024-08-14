import { TargetEntity } from '../entities/Target';
import {
  TargetStrategyType,
  TargetScopeType,
  TargetType,
  TargetPrivacyType,
} from '../types';

export const targetMock = {
  id: '0d9330b7-ae1a-43fd-ba79-69ab186fd069',
  companyId: 'D483271B-D5AD-490C-67C4-D5D66B320890',
  year: 2019,
  reduction: 80,
  strategy: TargetStrategyType.Aggressive,
  includeCarbonOffset: false,
  scopeType: TargetScopeType.Scope_1_2,
  privacyType: TargetPrivacyType.Public,
  targetType: TargetType.Absolute,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const targetScope3Mock = {
  id: '8eb8f4c5-5a2c-4f0e-b1db-4ed1478fe59e',
  companyId: 'D483271B-D5AD-490C-67C4-D5D66B320890',
  year: 2035,
  reduction: 80,
  strategy: TargetStrategyType.Passive,
  includeCarbonOffset: false,
  scopeType: TargetScopeType.Scope_3,
  privacyType: TargetPrivacyType.Public,
  targetType: TargetType.Absolute,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const intensityTargetMock = {
  id: '0d9330b7-ae1a-43fd-ba79-69ab186fd070',
  companyId: 'D483271B-D5AD-490C-67C4-D5D66B320890',
  year: 2019,
  reduction: 80,
  strategy: TargetStrategyType.Aggressive,
  includeCarbonOffset: false,
  scopeType: TargetScopeType.Scope_1_2,
  privacyType: TargetPrivacyType.Public,
  targetType: TargetType.Intensity,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedAt: '2020-08-27 09:11:00',
};

export const intensityScope3TargetMock = {
  id: '8eb8f4c5-5a2c-4f0e-b1db-4ed1478fe59f',
  companyId: 'D483271B-D5AD-490C-67C4-D5D66B320890',
  year: 2035,
  reduction: 80,
  strategy: TargetStrategyType.Passive,
  includeCarbonOffset: false,
  scopeType: TargetScopeType.Scope_3,
  privacyType: TargetPrivacyType.Public,
  targetType: TargetType.Intensity,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedAt: '2020-08-27 09:11:00',
};

export const createTargetMock = (
  overrides: Partial<TargetEntity> & {
    id: string;
    companyId: string;
    createdBy: string;
    updatedBy: string;
  }
) => ({
  year: 2035,
  reduction: 80,
  strategy: TargetStrategyType.Passive,
  includeCarbonOffset: false,
  scopeType: TargetScopeType.Scope_1_2,
  privacyType: TargetPrivacyType.Public,
  targetType: TargetType.Absolute,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
