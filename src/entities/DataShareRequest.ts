import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('DATA_SHARE_REQUEST')
export class DataShareRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', nullable: false, type: 'uniqueidentifier' })
  companyId!: string;

  @Column({
    name: 'target_company_id',
    nullable: false,
    type: 'uniqueidentifier',
  })
  targetCompanyId!: string;

  @Column({ name: 'created_by', nullable: false, type: 'uniqueidentifier' })
  createdBy!: string;

  @Column({ name: 'created_at', nullable: false, type: 'datetime' })
  createdAt!: Date;
}

export interface IDataShareRequest {
  id: string;
  companyId: string;
  targetCompanyId: string;
  createdBy: string;
  createdAt: Date;
}
