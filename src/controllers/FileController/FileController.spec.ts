import { EntityManager, Repository } from 'typeorm';

import { IContext } from '../../apolloContext';
import { supplierEditorUserMock } from '../../mocks/user';
import { FileController, NO_FILE_ERROR } from '.';
import { fileMock } from '../../mocks/file';
import { FileEntity } from '../../entities/File';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';

describe('FileController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('deleteInTransaction()', () => {
    it('should delete a file', async () => {
      const deleteFromDB = jest.fn();
      const transactionEntityManager = {
        delete: deleteFromDB,
      };
      const deleteFile = jest.fn();
      const findOne = jest.fn();
      const repositoryMock = ({
        findOne,
      } as unknown) as Repository<FileEntity>;
      findOne.mockImplementation(() => fileMock);
      const mockContext = ({
        user: supplierEditorUserMock,
        clients: {
          azureBlob: { deleteFile },
        },
      } as unknown) as IContext;

      const controller = new FileController(repositoryMock);

      const result = await controller.deleteInTransaction(
        {
          id: fileMock.id,
          transactionEntityManager: (transactionEntityManager as unknown) as EntityManager,
        },
        mockContext
      );

      expect(deleteFile).toHaveBeenCalledWith({
        fileName: fileMock.azureBlobFilename,
        containerId: supplierEditorUserMock.companyId.toLowerCase(),
      });
      expect(deleteFromDB).toHaveBeenCalledWith(FileEntity, fileMock);
      expect(result).toEqual(fileMock.id);
    });

    it('should return an error if current user does not belong to a company', async () => {
      const transactionEntityManager = {};
      const repositoryMock = ({} as unknown) as Repository<FileEntity>;
      const mockContext = ({
        user: { ...supplierEditorUserMock, companyId: null },
      } as unknown) as IContext;

      const controller = new FileController(repositoryMock);

      expect.assertions(1);
      try {
        await controller.deleteInTransaction(
          {
            id: fileMock.id,
            transactionEntityManager: (transactionEntityManager as unknown) as EntityManager,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should return an error if file for provided id does not exist', async () => {
      const transactionEntityManager = {};
      const findOne = jest.fn();
      const repositoryMock = ({
        findOne,
      } as unknown) as Repository<FileEntity>;
      findOne.mockImplementation(() => undefined);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = new FileController(repositoryMock);

      expect.assertions(1);
      try {
        await controller.deleteInTransaction(
          {
            id: fileMock.id,
            transactionEntityManager: (transactionEntityManager as unknown) as EntityManager,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(NO_FILE_ERROR);
      }
    });

    it('should return an error if blob fails to be deleted', async () => {
      const blobDeleteErrorMessage = 'Blob deletion failed';
      const deleteBlobFile = jest.fn();
      deleteBlobFile.mockRejectedValue(new Error(blobDeleteErrorMessage));

      const deleteFromDB = jest.fn();
      const transactionEntityManager = {
        delete: deleteFromDB,
      };

      const findOne = jest.fn();
      findOne.mockImplementation(() => fileMock);

      const repositoryMock = ({
        findOne,
      } as unknown) as Repository<FileEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
        clients: {
          azureBlob: { deleteFile: deleteBlobFile },
        },
      } as unknown) as IContext;

      const controller = new FileController(repositoryMock);

      expect.assertions(2);
      try {
        await controller.deleteInTransaction(
          {
            id: fileMock.id,
            transactionEntityManager: (transactionEntityManager as unknown) as EntityManager,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(blobDeleteErrorMessage);
        expect(deleteFromDB).not.toHaveBeenCalled();
      }
    });

    it('should return an error if DB fails to be deleted', async () => {
      const dbDeleteErrorMessage = 'File deletion failed';
      const deleteBlobFile = jest.fn();

      const deleteFromDB = jest.fn();
      deleteFromDB.mockRejectedValue(new Error(dbDeleteErrorMessage));
      const transactionEntityManager = {
        delete: deleteFromDB,
      };

      const findOne = jest.fn();
      findOne.mockImplementation(() => fileMock);

      const repositoryMock = ({
        findOne,
      } as unknown) as Repository<FileEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
        clients: {
          azureBlob: { deleteFile: deleteBlobFile },
        },
      } as unknown) as IContext;

      const controller = new FileController(repositoryMock);

      expect.assertions(1);
      try {
        await controller.deleteInTransaction(
          {
            id: fileMock.id,
            transactionEntityManager: (transactionEntityManager as unknown) as EntityManager,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(dbDeleteErrorMessage);
      }
    });
  });
});
