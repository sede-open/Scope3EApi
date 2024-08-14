import { EntityManager, Repository } from 'typeorm';
import { ApolloError } from 'apollo-server-express';

import { ControllerFunctionAsync } from '../types';
import { FileEntity } from '../../entities/File';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';

export const NO_FILE_ERROR = 'File does not exist';
export const FILE_NOT_DELETED = 'File could be deleted';

export class FileController {
  constructor(private fileRepository: Repository<FileEntity>) {}

  deleteInTransaction: ControllerFunctionAsync<
    {
      id: string;
      transactionEntityManager: EntityManager;
    },
    string
  > = async ({ id, transactionEntityManager: entityManager }, context) => {
    if (!context.user.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const file = await this.fileRepository.findOne(id);

    if (!file) {
      throw new ApolloError(NO_FILE_ERROR);
    }

    await context.clients.azureBlob.deleteFile({
      containerId: context.user.companyId.toLowerCase(),
      fileName: file.azureBlobFilename,
    });

    await entityManager.delete(FileEntity, file);

    return file.id;
  };
}
