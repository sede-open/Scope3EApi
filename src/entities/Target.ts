import { Transform } from 'class-transformer';
import _ from 'lodash';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ITarget } from '../services/TargetService/types';
import {
  CarbonIntensityMetricType,
  TargetPrivacyType,
  TargetScopeType,
  TargetStrategyType,
  TargetType,
} from '../types';
import { CarbonIntensityEntity } from './CarbonIntensity';
import { CompanyEntity } from './Company';
import { UserEntity } from './User';

export interface UserEditableTargetFields {
  strategy: TargetStrategyType;
  year: number;
  includeCarbonOffset: boolean;
  reduction: number;
  privacyType: TargetPrivacyType;
}

@Entity('TARGET')
export class TargetEntity extends BaseEntity implements ITarget {
  constructor({
    strategy,
    companyId,
    year,
    reduction,
    includeCarbonOffset,
    scopeType,
    targetType,
    createdBy,
    updatedBy,
    carbonIntensities,
    privacyType,
  }: {
    strategy?: TargetEntity['strategy'];
    companyId?: TargetEntity['companyId'];
    year?: TargetEntity['year'];
    reduction?: TargetEntity['reduction'];
    includeCarbonOffset?: TargetEntity['includeCarbonOffset'];
    scopeType?: TargetEntity['scopeType'];
    targetType?: TargetEntity['targetType'];
    createdBy?: TargetEntity['createdBy'];
    updatedBy?: TargetEntity['updatedBy'];
    carbonIntensities?: TargetEntity['carbonIntensities'];
    privacyType?: TargetEntity['privacyType'];
  } = {}) {
    super();
    this.strategy = strategy!;
    this.companyId = companyId!;
    this.year = year!;
    this.reduction = reduction!;
    this.includeCarbonOffset = includeCarbonOffset!;
    this.scopeType = scopeType!;
    this.targetType = targetType!;
    this.createdBy = createdBy!;
    this.updatedBy = updatedBy;
    this.carbonIntensities = carbonIntensities ?? undefined;
    this.privacyType = privacyType!;
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  strategy!: TargetStrategyType;

  @Column({ name: 'company_id' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company!: CompanyEntity;

  @Column()
  year!: number;

  @Column()
  reduction!: number;

  @Column({ name: 'include_carbon_offset' })
  includeCarbonOffset!: boolean;

  @Column({ name: 'scope_type' })
  scopeType!: TargetScopeType;

  @Column({ name: 'target_type' })
  targetType!: TargetType;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdByUser!: UserEntity;

  @Column({ name: 'updated_by' })
  updatedBy?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updatedByUser?: UserEntity;

  @ManyToMany(
    () => CarbonIntensityEntity,
    (targetEntity) => targetEntity.targets
  )
  carbonIntensities?: CarbonIntensityEntity[];

  @Transform(({ value }) => (value as Date).toISOString(), {
    toPlainOnly: true,
  })
  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readonly createdAt!: Date;

  @Transform(({ value }) => (value as Date).toISOString(), {
    toPlainOnly: true,
  })
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  readonly updatedAt!: Date;

  @Column({ name: 'privacy_type' })
  privacyType!: TargetPrivacyType;

  editableFieldsHaveChanged<T extends UserEditableTargetFields>({
    reduction,
    includeCarbonOffset,
    year,
    strategy,
    privacyType,
  }: T) {
    return (
      this.reduction !== reduction ||
      this.includeCarbonOffset !== includeCarbonOffset ||
      this.year !== year ||
      this.strategy !== strategy ||
      this.privacyType !== privacyType
    );
  }

  carbonIntensitiesHaveChanged(
    newIntensityMetrics: CarbonIntensityMetricType[]
  ) {
    if (!Array.isArray(this.carbonIntensities)) {
      throw new Error(
        `carbonIntensities have not been loaded on this instance (id: ${this.id}) -- to compare for differences you must first load the relations`
      );
    }

    const intensityMetrics = this.carbonIntensities.map(
      (ci) => ci.intensityMetric
    );

    return !_.isEqual(new Set(newIntensityMetrics), new Set(intensityMetrics));
  }
}
