import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyPrivacy } from '../repositories/CompanyPrivacyRepository/types';
import { CompanyEntity } from './Company';

@Entity('COMPANY_PRIVACY')
export class CompanyPrivacyEntity extends BaseEntity implements CompanyPrivacy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uniqueidentifier' })
  companyId!: string;

  @OneToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company!: CompanyEntity;

  @Column({ name: 'all_platform', type: 'bit' })
  allPlatform!: boolean;

  @Column({ name: 'customer_network', type: 'bit' })
  customerNetwork!: boolean;

  @Column({ name: 'supplier_network', type: 'bit' })
  supplierNetwork!: boolean;

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
  readonly updatedAt!: Date;
}
