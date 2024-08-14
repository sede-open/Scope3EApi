import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ICarbonIntensity } from '../services/CarbonIntensityService/types';
import { CarbonIntensityMetricType, CarbonIntensityType } from '../types';
import { CompanyEntity } from './Company';
import { CorporateEmissionEntity } from './CorporateEmission';
import { TargetEntity } from './Target';
import { UserEntity } from './User';

@Entity('CARBON_INTENSITY')
export class CarbonIntensityEntity
  extends BaseEntity
  implements ICarbonIntensity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company!: CompanyEntity;

  @Column()
  year!: number;

  @Column({ name: 'carbon_intensity_metric' })
  intensityMetric!: CarbonIntensityMetricType;

  @Column({ name: 'carbon_intensity_value', type: 'float' })
  intensityValue!: number;

  @Column({ name: 'emission_id' })
  emissionId!: string;

  @ManyToOne(() => CorporateEmissionEntity)
  @JoinColumn({ name: 'emission_id', referencedColumnName: 'id' })
  emission!: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdByUser!: UserEntity;

  @Column({ name: 'updated_by' })
  updatedBy?: string;

  @Column({
    name: 'type',
    nullable: false,
    default: CarbonIntensityType.UserSubmitted,
  })
  type!: CarbonIntensityType;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updatedByUser?: UserEntity;

  @ManyToMany(
    () => TargetEntity,
    (targetEntity) => targetEntity.carbonIntensities
  )
  @JoinTable({
    name: 'CARBON_INTENSITY_TARGET',
    joinColumn: {
      name: 'carbon_intensity_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'target_id',
      referencedColumnName: 'id',
    },
  })
  targets?: TargetEntity[];

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
  readonly updatedAt?: Date | null;
}
