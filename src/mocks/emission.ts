import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import { CorporateEmissionType, Scope2Type } from '../types';
import { getCorporateEmissionAccessMock } from './emissionAccess';
import { fileMock } from './file';

const corporateEmissionAccessInput = getCorporateEmissionAccessMock();

export const baselineMock = {
  id: '843ea40e-eb82-4112-adce-edb0ef58f54a'.toUpperCase(),
  companyId: 'D483271B-D5AD-490C-67C4-D5D66B320890',
  type: CorporateEmissionType.Baseline,
  year: 2019,
  scope1: 4563.32,
  scope2: 6321.32,
  scope3: null,
  scope2Type: Scope2Type.Market,
  offset: null,
  examplePercentage: 56,
  headCount: 250,
  verificationFileId: fileMock.id,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  corporateEmissionAccess: corporateEmissionAccessInput,
};

export const emissionAccessMock = getCorporateEmissionAccessMock();

export const actualMock = {
  id: 'a51508a9-85ca-4313-96f1-aa2e93916712',
  companyId: 'D483271B-D5AD-490C-67C4-D5D66B320890',
  type: CorporateEmissionType.Actual,
  year: 2020,
  scope1: 1234.32,
  scope2: 5689.32,
  scope3: 1000,
  scope2Type: Scope2Type.Market,
  offset: undefined,
  examplePercentage: 42,
  headCount: 150,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const externalBaselineMock = {
  id: 'a71597a3-ab3e-487f-a5d8-37205f0eef2c',
  companyId: '9083271b-d5ad-490c-67c4-d5d66b320890',
  type: CorporateEmissionType.Baseline,
  year: 2019,
  scope1: 4563.32,
  scope2: 6321.32,
  scope3: undefined,
  offset: undefined,
  examplePercentage: 56,
  headCount: 250,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const createCorporateEmissionMock = (
  overrides: Partial<CorporateEmissionEntity> & {
    companyId: string;
  }
) => ({
  type: CorporateEmissionType.Baseline,
  year: 2019,
  scope1: 4563.32,
  scope2: 6321.32,
  scope3: undefined,
  offset: undefined,
  examplePercentage: 56,
  headCount: 250,
  createdBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  ...overrides,
});
