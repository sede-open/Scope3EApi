import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { AuditActionType } from '../constants/audit';

@Entity('AUDIT')
export class AuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'action' })
  action!: AuditActionType;

  @Column({ name: 'current_payload', comment: 'stringified JSON object' })
  currentPayload?: string;

  @Column({ name: 'previous_payload', comment: 'stringified JSON object' })
  previousPayload?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readonly createdAt?: Date;
}
