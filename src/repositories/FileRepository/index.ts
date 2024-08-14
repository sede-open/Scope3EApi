import { EntityRepository } from 'typeorm';
import { FileEntity } from '../../entities/File';
import { IFile } from '../../services/FileService/types';
import { CustomRepository } from '../Repository';

@EntityRepository(FileEntity)
export class FileRepository extends CustomRepository<FileEntity, IFile> {}
