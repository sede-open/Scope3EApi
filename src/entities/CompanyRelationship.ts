import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InviteStatus, CompanyRelationshipType } from '../types';
import { CompanyEntity } from './Company';
import { UserEntity } from './User';

@Entity('COMPANY_RELATIONSHIP')
export class CompanyRelationshipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @Column({ name: 'supplier_id' })
  supplierId!: string;

  @Column({ name: 'customer_approver_id' })
  customerApproverId!: string;

  @Column({ name: 'supplier_approver_id' })
  supplierApproverId!: string;

  @Column({ name: 'invite_type' })
  inviteType!: CompanyRelationshipType;

  @Column()
  status!: InviteStatus;

  @Column({ type: 'nvarchar' })
  note?: string | null;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'id' })
  customer!: CompanyEntity;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'supplier_id', referencedColumnName: 'id' })
  supplier!: CompanyEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'customer_approver_id', referencedColumnName: 'id' })
  customerApprover?: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'supplier_approver_id', referencedColumnName: 'id' })
  supplierApprover?: UserEntity;

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
