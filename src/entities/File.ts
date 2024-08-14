import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IFile } from '../services/FileService/types';
import { CompanyEntity } from './Company';
import { UserEntity } from './User';

@Entity('FILE')
export class FileEntity extends BaseEntity implements IFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'original_filename' })
  originalFilename!: string;

  @Column({ name: 'azure_blob_filename' })
  azureBlobFilename!: string;

  @Column()
  mimetype!: string;

  @Column({ name: 'size_in_bytes' })
  sizeInBytes!: number;

  @Column({ name: 'company_id' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company!: CompanyEntity;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdByUser!: UserEntity;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readonly createdAt!: Date;
}
