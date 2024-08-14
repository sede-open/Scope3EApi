import * as uuid from 'uuid';
import { CompanyRelationshipEntity } from '../entities/CompanyRelationship';
import { CompanyRelationshipType, InviteStatus } from '../types';
import { companyMock, company2Mock } from './company';
import { supplierEditorUser2Mock, supplierEditorUserMock } from './user';

export const companySupplierMock = {
  id: '8185a175-ddb5-4ffa-b14c-a0447ea7e7fc',
  supplierId: company2Mock.id,
  customerId: companyMock.id,
  status: InviteStatus.Approved,
  inviteType: CompanyRelationshipType.Supplier,
  customerApproverId: supplierEditorUserMock.id,
  supplierApproverId: supplierEditorUser2Mock.id,
  note: 'Just do it',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const companyCustomerMock = {
  id: '227061ae-0d1b-4c11-b945-754d79b68a45',
  supplierId: companyMock.id,
  customerId: company2Mock.id,
  status: InviteStatus.AwaitingCustomerApproval,
  inviteType: CompanyRelationshipType.Customer,
  customerApproverId: undefined,
  supplierApproverId: supplierEditorUserMock.id,
  note: 'Make it better',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
};

export const createCompanyRelationshipMock = (
  data: Partial<CompanyRelationshipEntity>
) => ({
  id: uuid.v4(),
  supplierId: companyMock.id,
  customerId: company2Mock.id,
  status: InviteStatus.AwaitingCustomerApproval,
  inviteType: CompanyRelationshipType.Customer,
  customerApproverId: undefined,
  supplierApproverId: supplierEditorUserMock.id,
  note: 'Make it better',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  ...data,
});
