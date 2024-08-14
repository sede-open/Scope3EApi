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
import { CorporateEmissionAccess } from '../services/CorporateEmissionAccessService/types';

@Entity('CORPORATE_EMISSION_ACCESS')
export class CorporateEmissionAccessEntity
  extends BaseEntity
  implements CorporateEmissionAccess {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'emission_id' })
  emissionId!: string;

  @OneToOne(() => CorporateEmissionAccessEntity)
  @JoinColumn({ name: 'emission_id', referencedColumnName: 'id' })
  corporateEmissionAccess!: CorporateEmissionAccessEntity;

  @Column({ name: 'scope_1_2', type: 'bit', default: 0 })
  scope1And2!: boolean;

  @Column({ name: 'scope_3', type: 'bit', default: 0 })
  scope3!: boolean;

  @Column({ name: 'carbon_offsets', type: 'bit', default: 0 })
  carbonOffsets!: boolean;

  @Column({ name: 'carbon_intensity', type: 'bit', default: 0 })
  carbonIntensity!: boolean;

  @Column({ name: 'public_link', nullable: true, type: 'varchar' })
  publicLink?: string | null;

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
