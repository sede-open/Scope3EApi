import fs from 'fs';
import { FindConditions } from 'typeorm';
import { AzureBlobClient } from '../../clients/AzureBlobClient';
import { FileEntity } from '../../entities/File';
import { FileRepository } from '../../repositories/FileRepository';
import { BaseService } from '../BaseService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { IFile } from './types';

export class FileService extends BaseService<FileEntity, IFile> {
  constructor(
    databaseService: DatabaseService,
    private azureBlobClient: AzureBlobClient
  ) {
    super(databaseService, FileRepository);
  }

  async deleteFile(
    findConditions: FindConditions<FileEntity>,
    companyId: string
  ) {
    const file = await this.findOneOrFail({
      where: findConditions,
    });

    await this.azureBlobClient.deleteFile({
      containerId: companyId.toLowerCase(),
      fileName: file.azureBlobFilename,
    });

    await this.delete(file);
    return file.id;
  }

  writeJsonToFile<T>(filePath: string, data: T) {
    const json = JSON.stringify(data);
    fs.writeFileSync(filePath, json);
  }
}
