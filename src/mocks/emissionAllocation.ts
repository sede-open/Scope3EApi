import { EmissionAllocationEntity } from '../entities/EmissionAllocation';
import {
  EmissionAllocationMethod,
  EmissionAllocationStatus,
  EmissionAllocationType,
} from '../types';
import { cat1Mock } from './category';
import { companyMock, company2Mock, company3Mock } from './company';
import { baselineMock } from './emission';
import { supplierEditorUser2Mock, supplierEditorUserMock } from './user';

export const emissionAllocationSentBySupplier = {
  id: '09e228de-3dde-4e63-8b56-177cee72e33a'.toUpperCase(),
  year: 2020,
  type: EmissionAllocationType.Scope_3,
  status: EmissionAllocationStatus.AwaitingApproval,
  customerEmissionId: undefined,
  supplierEmissionId: undefined,
  supplierId: company2Mock.id.toUpperCase(),
  customerId: companyMock.id.toUpperCase(),
  customerApproverId: supplierEditorUser2Mock.id.toUpperCase(),
  supplierApproverId: supplierEditorUserMock.id.toUpperCase(),
  categoryId: cat1Mock.id.toUpperCase(),
  allocationMethod: EmissionAllocationMethod.Economical,
  emissions: 1234.09,
  note: 'Hello there',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const emissionAllocationSentByMe = {
  id: '49262650-cd8a-430f-912b-a65a94d6c49d'.toUpperCase(),
  year: 2020,
  type: EmissionAllocationType.Scope_3,
  status: EmissionAllocationStatus.AwaitingApproval,
  customerEmissionId: undefined,
  supplierEmissionId: baselineMock.id.toUpperCase(),
  supplierId: companyMock.id.toUpperCase(),
  customerId: company2Mock.id.toUpperCase(),
  customerApproverId: supplierEditorUserMock.id.toUpperCase(),
  supplierApproverId: supplierEditorUser2Mock.id.toUpperCase(),
  categoryId: cat1Mock.id.toUpperCase(),
  allocationMethod: EmissionAllocationMethod.Economical,
  emissions: 9876.09,
  note: 'Hey hey',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const emissionAllocationRequestedByMe = {
  id: '10c291ee-213c-4a8f-b309-5a2837358550',
  year: 2020,
  type: EmissionAllocationType.Scope_3,
  status: EmissionAllocationStatus.Requested,
  customerEmissionId: baselineMock.id.toUpperCase(),
  supplierEmissionId: null,
  supplierId: company2Mock.id.toUpperCase(),
  customerId: companyMock.id.toUpperCase(),
  customerApproverId: supplierEditorUserMock.id.toUpperCase(),
  supplierApproverId: null,
  categoryId: null,
  allocationMethod: null,
  emissions: null,
  note: 'Please provide me with allocations',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const externalEmissionAllocation = {
  id: '99c02320-91ee-41be-beec-02db6dfa35d0',
  year: 2020,
  type: EmissionAllocationType.Scope_3,
  status: EmissionAllocationStatus.AwaitingApproval,
  customerEmissionId: undefined,
  supplierEmissionId: undefined,
  supplierId: company3Mock.id.toUpperCase(),
  customerId: company2Mock.id.toUpperCase(),
  customerApproverId: supplierEditorUserMock.id.toUpperCase(),
  supplierApproverId: supplierEditorUser2Mock.id.toUpperCase(),
  categoryId: cat1Mock.id.toUpperCase(),
  allocationMethod: EmissionAllocationMethod.Economical,
  emissions: 99999,
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const createEmissionAllocationMock = ({
  id,
  supplierId,
  customerId,
  ...rest
}: Partial<EmissionAllocationEntity> & {
  customerId: string;
  supplierId: string;
}) => ({
  id,
  year: 2020,
  type: EmissionAllocationType.Scope_3,
  status: EmissionAllocationStatus.AwaitingApproval,
  customerEmissionId: undefined,
  supplierEmissionId: undefined,
  supplierId,
  customerId,
  customerApproverId: undefined,
  supplierApproverId: undefined,
  allocationMethod: EmissionAllocationMethod.Economical,
  emissions: 3333,
  ...rest,
});
