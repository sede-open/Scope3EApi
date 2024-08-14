import request from 'supertest';
import { Server } from 'http';

import { startServer } from '../server';
import { authenticateUser } from '../auth';
import { RoleName } from '../types';
import { companyMock } from '../mocks/company';
import { supplierEditorUserMock } from '../mocks/user';
import { AzureBlobClient } from '../clients/AzureBlobClient';
import { getOrCreateConnection } from '../dbConnection';
import { FileEntity } from '../entities/File';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('../auth');
jest.mock('../clients/AzureBlobClient');

describe('files', () => {
  const originalFilename = 'small.pdf';
  beforeAll(() => {
    ((AzureBlobClient as unknown) as jest.Mock).mockImplementation(() => ({
      uploadFile: jest.fn(),
    }));
  });

  describe('/emission-verification', () => {
    let server: Server;

    beforeEach(async () => {
      server = await startServer();
    });

    afterEach(async () => {
      server.close();
      const connection = await getOrCreateConnection();
      await connection.getRepository(FileEntity).delete({
        originalFilename,
      });
    });

    it('should upload the file', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );

      ((authenticateUser as unknown) as jest.Mock).mockImplementationOnce(
        () => ({
          user: {
            ...supplierEditorUserMock,
            company: companyMock,
            role: {
              name: RoleName.SupplierEditor,
            },
            roles,
          },
        })
      );

      expect.assertions(1);

      const response = await request(server)
        .post('/files/emission-verification')
        .set('X-Token-Issuer', 'AKAMAI')
        .set('Authorization', 'Bearer XXX')
        .attach('file', 'fixtures/files/' + originalFilename)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          mimetype: 'application/pdf',
          originalFilename,
          azureBlobFilename: expect.stringContaining(originalFilename),
          sizeInBytes: 28575,
          companyId: supplierEditorUserMock.companyId,
          createdBy: supplierEditorUserMock.id,
        })
      );
    });

    it('should throw an error if the user is unauthenticated', async () => {
      ((authenticateUser as unknown) as jest.Mock).mockImplementationOnce(
        () => ({ user: null })
      );

      const response = await request(server)
        .post('/files/emission-verification')
        .set('X-Token-Issuer', 'AKAMAI')
        .set('Authorization', 'Bearer XXX')
        .attach('file', 'fixtures/files/small.pdf');
      expect(response.status).toEqual(401);
    });

    it('should throw an error if a file was not attached', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementationOnce(
        () => ({
          user: {
            ...supplierEditorUserMock,
            company: companyMock,
            role: {
              name: RoleName.SupplierEditor,
            },
            roles,
          },
        })
      );

      const response = await request(server)
        .post('/files/emission-verification')
        .set('X-Token-Issuer', 'AKAMAI')
        .set('Authorization', 'Bearer XXX');

      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        message: 'Provided payload is not valid',
        status: 400,
      });
    });

    it('should not upload the file for a SupplierViewer', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierViewer
      );

      ((authenticateUser as unknown) as jest.Mock).mockImplementationOnce(
        () => ({
          user: {
            ...supplierEditorUserMock,
            company: companyMock,
            role: {
              name: RoleName.SupplierViewer,
            },
            roles,
          },
        })
      );

      const response = await request(server)
        .post('/files/emission-verification')
        .set('X-Token-Issuer', 'AKAMAI')
        .set('Authorization', 'Bearer XXX')
        .attach('file', 'fixtures/files/small.pdf');

      expect(response.status).toEqual(403);
      expect(response.body).toEqual({
        message: 'You are not authorised to perform this action',
        status: 403,
      });
    });

    it('should throw an error if the user does not have a company assigned', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementationOnce(
        () => ({
          user: {
            ...supplierEditorUserMock,
            companyId: null,
            company: null,
            role: {
              name: RoleName.SupplierEditor,
            },
            roles,
          },
        })
      );

      const response = await request(server)
        .post('/files/emission-verification')
        .set('X-Token-Issuer', 'AKAMAI')
        .set('Authorization', 'Bearer XXX')
        .attach('file', 'fixtures/files/small.pdf');

      expect(response.status).toEqual(403);
      expect(response.body).toEqual({
        message: 'You are not authorised to perform this action',
        status: 403,
      });
    });

    it('should throw an error if the file is bigger than 20MB', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementationOnce(
        () => ({
          user: {
            ...supplierEditorUserMock,
            company: undefined,
            role: {
              name: RoleName.SupplierEditor,
            },
            roles,
          },
        })
      );

      const response = await request(server)
        .post('/files/emission-verification')
        .set('X-Token-Issuer', 'AKAMAI')
        .set('Authorization', 'Bearer XXX')
        .attach('file', 'fixtures/files/large.pdf');

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ message: 'File too large', status: 500 });
    });

    describe('pdf validation', () => {
      const file = Buffer.from('hello new world');

      beforeEach(async () => {
        const connection = await getOrCreateConnection();
        const roleRepository = connection.getCustomRepository(RoleRepository);
        const roles = await roleRepository.findAssumedRolesForRoleName(
          RoleName.SupplierEditor
        );
        ((authenticateUser as unknown) as jest.Mock).mockImplementationOnce(
          () => ({
            user: {
              ...supplierEditorUserMock,
              company: companyMock,
              role: {
                name: RoleName.SupplierEditor,
              },
              roles,
            },
          })
        );
      });

      describe('when non-pdf mimetype is provided', () => {
        it('should throw an error', (done) => {
          request(server)
            .post('/files/emission-verification')
            .set('X-Token-Issuer', 'AKAMAI')
            .set('Authorization', 'Bearer XXX')
            .attach('file', file, {
              filename: 'hello.pdf',
              contentType: 'image/png',
            })
            .expect(415, done);
        });
      });

      describe('when non-pdf extension is provided', () => {
        it('should throw an error', (done) => {
          request(server)
            .post('/files/emission-verification')
            .set('X-Token-Issuer', 'AKAMAI')
            .set('Authorization', 'Bearer XXX')
            .attach('file', file, {
              filename: 'hello.text',
              contentType: 'application/pdf',
            })
            .expect(415, done);
        });
      });

      describe('when the file does not contain correct pdf header and footer', () => {
        it('should throw an error', (done) => {
          request(server)
            .post('/files/emission-verification')
            .set('X-Token-Issuer', 'AKAMAI')
            .set('Authorization', 'Bearer XXX')
            .attach('file', file, {
              filename: 'hello.pdf',
              contentType: 'application/pdf',
            })
            .expect(415, done);
        });
      });
    });
  });
});
