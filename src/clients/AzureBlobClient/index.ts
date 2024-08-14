import { BlobServiceClient } from '@azure/storage-blob';
import internal from 'stream';
import { FILE_DELETE_FAILED } from '../../constants/errors';
import { logger } from '../../utils/logger';

export class AzureBlobClient {
  blobClient: BlobServiceClient;

  constructor(private azureStorageConnectionString: string) {
    this.blobClient = BlobServiceClient.fromConnectionString(
      this.azureStorageConnectionString
    );
  }

  public async uploadFile({
    containerId,
    fileStream,
    fileStreamLength,
    fileName,
  }: {
    containerId: string;
    fileStream: internal.Readable;
    fileStreamLength: number;
    fileName: string;
  }) {
    try {
      const containerClient = this.blobClient.getContainerClient(containerId);

      // by default the container/blob will not be publicly accessible
      await containerClient.createIfNotExists();

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      const blockBlobClientRes = await blockBlobClient.uploadStream(
        fileStream,
        fileStreamLength
      );

      return blockBlobClientRes;
    } catch (err) {
      logger.error(err, 'Failed to upload file');
      throw Error(`Failed to upload file: ${err.message}`);
    }
  }

  public async deleteFile({
    containerId,
    fileName,
  }: {
    containerId: string;
    fileName: string;
  }) {
    try {
      const containerClient = this.blobClient.getContainerClient(containerId);

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      const blockBlobClientRes = await blockBlobClient.deleteIfExists();

      if (!blockBlobClientRes.succeeded) {
        throw new Error(FILE_DELETE_FAILED);
      }

      return blockBlobClientRes.succeeded;
    } catch (err) {
      logger.error(err, FILE_DELETE_FAILED);
      throw new Error(err.message);
    }
  }
}
