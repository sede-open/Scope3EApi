import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { CompanyEntity } from './Company';
import { SectorEntity } from './Sector';
import { CompanySectorType } from '../types';
import { UserEntity } from './User';

@Entity('COMPANY_SECTOR')
export class CompanySectorEntity extends BaseEntity {
  constructor(
    companyId: string,
    sectorId: string,
    sectorType: CompanySectorType
  ) {
    super();

    this.companyId = companyId;
    this.sectorId = sectorId;
    this.sectorType = sectorType;
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id' })
  companyId!: string;

  @Column({ name: 'sector_id' })
  sectorId!: string;

  @Column({ name: 'type' })
  sectorType!: CompanySectorType;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company!: CompanyEntity;

  @ManyToOne(() => SectorEntity)
  @JoinColumn({ name: 'sector_id', referencedColumnName: 'id' })
  sector!: SectorEntity;

  @Column({ name: 'created_by' })
  createdBy?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdByUser?: UserEntity;

  @Column({ name: 'updated_by' })
  updatedBy?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updatedByUser?: UserEntity;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readonly createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  readonly updatedAt?: Date;
}
