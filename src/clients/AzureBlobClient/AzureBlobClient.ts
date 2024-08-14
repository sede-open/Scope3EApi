import { BlobServiceClient } from '@azure/storage-blob';
import { Readable } from 'stream';
import { FILE_DELETE_FAILED } from '../../constants/errors';

import { AzureBlobClient } from '.';

describe('AzureBlobClient', () => {
  describe('uploadFile()', () => {
    it('should upload a file to blob storage', async () => {
      const fileData = { someData: 'data' };
      const getContainerClient = jest.fn();
      const createIfNotExists = jest.fn();
      const getBlockBlobClient = jest.fn();
      const uploadStream = jest.fn();
      const blobClientMock = {
        getContainerClient,
        createIfNotExists,
        getBlockBlobClient,
        uploadStream,
      };
      getContainerClient.mockImplementation(() => blobClientMock);
      createIfNotExists.mockImplementation(() => blobClientMock);
      getBlockBlobClient.mockImplementation(() => blobClientMock);
      uploadStream.mockImplementation(() => fileData);

      BlobServiceClient.fromConnectionString = jest.fn();
      ((BlobServiceClient.fromConnectionString as unknown) as jest.Mock).mockImplementation(
        () => blobClientMock
      );

      const connectionString = 'some_connection_string';
      const client = new AzureBlobClient(connectionString);
      const payload = {
        containerId: '1234455',
        fileStream: new Readable(),
        fileStreamLength: 123,
        fileName: 'file.pdf',
      };

      const result = await client.uploadFile(payload);

      expect(result).toEqual(fileData);
      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(
        connectionString
      );
      expect(getContainerClient).toHaveBeenCalledWith(payload.containerId);
      expect(createIfNotExists).toHaveBeenCalled();
      expect(getBlockBlobClient).toHaveBeenCalledWith(payload.fileName);
      expect(uploadStream).toHaveBeenCalledWith(
        payload.fileStream,
        payload.fileStreamLength
      );
    });
  });

  describe('deleteFile()', () => {
    const containerId = 'containerId';
    const fileName = 'some.pdf';

    it('should delete a blob', async () => {
      const getContainerClient = jest.fn();
      const getBlockBlobClient = jest.fn();
      const deleteIfExists = jest.fn();
      const blobClientMock = {
        getContainerClient,
        getBlockBlobClient,
        deleteIfExists,
      };
      getContainerClient.mockImplementation(() => blobClientMock);
      getBlockBlobClient.mockImplementation(() => blobClientMock);
      deleteIfExists.mockImplementation(() => ({ succeeded: true }));

      BlobServiceClient.fromConnectionString = jest.fn();
      ((BlobServiceClient.fromConnectionString as unknown) as jest.Mock).mockImplementation(
        () => blobClientMock
      );

      const connectionString = 'some_connection_string';
      const client = new AzureBlobClient(connectionString);
      const result = await client.deleteFile({ containerId, fileName });

      expect(result).toBe(true);
      expect(getContainerClient).toHaveBeenCalledWith(containerId);
      expect(getBlockBlobClient).toHaveBeenCalledWith(fileName);
      expect(deleteIfExists).toHaveBeenCalled();
    });

    it('should throw an error on delete failure', async () => {
      const getContainerClient = jest.fn();
      const getBlockBlobClient = jest.fn();
      const deleteIfExists = jest.fn();
      const blobClientMock = {
        getContainerClient,
        getBlockBlobClient,
        deleteIfExists,
      };
      getContainerClient.mockImplementation(() => blobClientMock);
      getBlockBlobClient.mockImplementation(() => blobClientMock);
      deleteIfExists.mockImplementation(() => ({ succeeded: false }));

      BlobServiceClient.fromConnectionString = jest.fn();
      ((BlobServiceClient.fromConnectionString as unknown) as jest.Mock).mockImplementation(
        () => blobClientMock
      );

      const connectionString = 'some_connection_string';
      const client = new AzureBlobClient(connectionString);

      expect.assertions(4);

      try {
        await client.deleteFile({ containerId, fileName });
      } catch (err) {
        expect(getContainerClient).toHaveBeenCalledWith(containerId);
        expect(getBlockBlobClient).toHaveBeenCalledWith(fileName);
        expect(deleteIfExists).toHaveBeenCalled();
        expect(err.message).toContain(FILE_DELETE_FAILED);
      }
    });
  });
});
