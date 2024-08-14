import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

import { AppMetaName } from '../constants/appMeta';

@Entity('APP_META')
export class AppMetaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: AppMetaName;

  @Column({ comment: 'stringified JSON object' })
  value!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readonly createdAt!: Date;
}
