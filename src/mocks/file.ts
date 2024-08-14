import { companyMock } from './company';
import { supplierEditorUserMock } from './user';

export const fileMock = {
  id: '00fa38f9-6a25-4e85-bf14-b24e080cefe7',
  originalFilename: 'test.pdf',
  azureBlobFilename: '154545454545-test.pdf',
  mimetype: 'application/pdf',
  sizeInBytes: 1212121,
  companyId: companyMock.id,
  createdBy: supplierEditorUserMock.id,
  createdAt: '2020-08-27 09:11:00',
};

export const file2Mock = {
  id: '01ff1154-4968-463d-9790-dff1992ecc8c',
  originalFilename: 'test2.pdf',
  azureBlobFilename: '154545454545-test2.pdf',
  mimetype: 'application/pdf',
  sizeInBytes: 1243321,
  companyId: companyMock.id,
  createdBy: supplierEditorUserMock.id,
  createdAt: '2020-08-27 09:11:00',
};
