import { CompanySectorEntity } from '../entities/CompanySector';
import { CompanySectorType } from '../types';
import { sector2Mock, sectorMock } from './sector';
import {
  adminUserMock,
  supplierEditorUser2Mock,
  supplierEditorUserMock,
} from './user';

type CompanySectorEntityMock = Omit<
  CompanySectorEntity,
  | 'createdAt'
  | 'updatedAt'
  | 'company'
  | 'sector'
  | 'hasId'
  | 'save'
  | 'remove'
  | 'softRemove'
  | 'recover'
  | 'reload'
>;

export interface CompanySectorMock extends CompanySectorEntityMock {
  createdAt: string;
  updatedAt: string;
}

export const companySectorMock: CompanySectorMock = {
  id: 'C5B4E9F0-128A-498D-A6BB-035DFA47447F',
  companyId: supplierEditorUserMock.companyId,
  sectorId: sectorMock.id,
  sectorType: CompanySectorType.Primary,
  createdBy: supplierEditorUserMock.id,
  updatedBy: supplierEditorUserMock.id,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const companySector2Mock = {
  id: 'FEDCB9A8-AC5B-4DBA-882F-20FFBF0CA610',
  companyId: supplierEditorUserMock.companyId,
  sectorId: sector2Mock.id,
  sectorType: CompanySectorType.Secondary,
  createdBy: supplierEditorUserMock.id,
  updatedBy: supplierEditorUserMock.id,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const companySector3Mock = {
  id: 'AB7DB333-E1EF-46BD-B9B0-920405CBE28F',
  companyId: supplierEditorUser2Mock.companyId,
  sectorId: sector2Mock.id,
  sectorType: CompanySectorType.Primary,
  createdBy: supplierEditorUserMock.id,
  updatedBy: supplierEditorUserMock.id,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const createCompanySectorMock = (
  overrides: Partial<CompanySectorEntity> & {
    companyId: string;
    sectorId: string;
    createdBy: string;
    updatedBy: string;
  }
) => {
  return {
    sectorType: CompanySectorType.Primary,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

export const createCompanySectorMockUsingAdminUser = (
  overrides: Partial<CompanySectorEntity> & {
    companyId: string;
    sectorId: string;
  }
) => {
  return {
    sectorType: CompanySectorType.Primary,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: adminUserMock.id,
    updatedBy: adminUserMock.id,
    ...overrides,
  };
};
