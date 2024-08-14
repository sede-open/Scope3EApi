import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  EmissionAllocationMethod,
  EmissionAllocationStatus,
  EmissionAllocationType,
} from '../types';
import { CategoryEntity } from './Category';
import { CompanyEntity } from './Company';
import { CorporateEmissionEntity } from './CorporateEmission';
import { UserEntity } from './User';

@Entity('EMISSION_ALLOCATION')
export class EmissionAllocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @Column({ name: 'supplier_id', nullable: true, type: 'uniqueidentifier' })
  supplierId?: string | null;

  @Column({
    name: 'customer_approver_id',
    nullable: true,
    type: 'uniqueidentifier',
  })
  customerApproverId?: string | null;

  @Column({
    name: 'supplier_approver_id',
    nullable: true,
    type: 'uniqueidentifier',
  })
  supplierApproverId?: string | null;

  @Column({
    name: 'customer_emission_id',
    nullable: true,
    type: 'uniqueidentifier',
  })
  customerEmissionId?: string | null;

  @Column({
    name: 'supplier_emission_id',
    nullable: true,
    type: 'uniqueidentifier',
  })
  supplierEmissionId?: string | null;

  @Column({
    name: 'category_id',
    nullable: true,
    type: 'uniqueidentifier',
  })
  categoryId?: string | null;

  @Column()
  year!: number;

  @Column({ type: 'varchar' })
  status!: EmissionAllocationStatus;

  @Column({ type: 'varchar' })
  type!: EmissionAllocationType;

  @Column({ type: 'float', nullable: true })
  emissions?: number | null;

  @Column({ name: 'allocation_method', nullable: true, type: 'varchar' })
  allocationMethod?: EmissionAllocationMethod | null;

  @Column({
    name: 'added_to_customer_scope_total',
    nullable: true,
    type: 'bit',
  })
  addedToCustomerScopeTotal?: boolean | null;

  @Column({ type: 'nvarchar', nullable: true })
  note?: string | null;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'id' })
  customer!: CompanyEntity;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'supplier_id', referencedColumnName: 'id' })
  supplier?: CompanyEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'customer_approver_id', referencedColumnName: 'id' })
  customerApprover?: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'supplier_approver_id', referencedColumnName: 'id' })
  supplierApprover?: UserEntity;

  @ManyToOne(() => CorporateEmissionEntity)
  @JoinColumn({ name: 'customer_emission_id', referencedColumnName: 'id' })
  customerEmission?: CorporateEmissionEntity;

  @ManyToOne(() => CorporateEmissionEntity)
  @JoinColumn({ name: 'supplier_emission_id', referencedColumnName: 'id' })
  supplierEmission?: CorporateEmissionEntity;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category?: CategoryEntity;

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
