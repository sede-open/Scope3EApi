import { FileService } from '.';
import { AzureBlobClient } from '../../clients/AzureBlobClient';
import { fileMock } from '../../mocks/file';
import { supplierEditorUserMock } from '../../mocks/user';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('FileService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('deleteFile()', () => {
    it('should delete a file', async () => {
      const deleteFile = jest.fn();
      const azureClient = { deleteFile };
      const fileService = new FileService(
        (jest.fn() as unknown) as DatabaseService,
        (azureClient as unknown) as AzureBlobClient
      );
      fileService.delete = jest.fn();
      const findOneOrFail = jest.fn();
      findOneOrFail.mockImplementation(() => {
        return fileMock;
      });
      fileService.findOneOrFail = findOneOrFail;

      const result = await fileService.deleteFile(
        {
          id: fileMock.id,
        },
        supplierEditorUserMock.companyId.toLowerCase()
      );

      expect(azureClient.deleteFile).toHaveBeenCalledWith({
        fileName: fileMock.azureBlobFilename,
        containerId: supplierEditorUserMock.companyId.toLowerCase(),
      });
      expect(fileService.delete).toHaveBeenCalledWith(fileMock);
      expect(result).toEqual(fileMock.id);
    });
  });
});
