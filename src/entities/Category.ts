import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';
import { CategoryType, CategoriesSystemName } from '../types';

@Entity('GHG_PROTOCOL_CATEGORY')
export class CategoryEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name' })
  name!: string;

  @Column({ name: 'system_name' })
  systemName!: CategoriesSystemName;

  @Column({ name: 'order' })
  order!: number;

  @Column({ name: 'type', type: 'varchar' })
  type!: CategoryType;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readonly createdAt!: Date;
}
