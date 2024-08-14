import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ICorporateEmission } from '../services/CorporateEmissionService/types';
import { CorporateEmissionType, Scope2Type } from '../types';
import { CarbonIntensityEntity } from './CarbonIntensity';
import { CompanyEntity } from './Company';
import { CorporateEmissionAccessEntity } from './CorporateEmissionAccess';
import { FileEntity } from './File';
import { UserEntity } from './User';

@Entity('CORPORATE_EMISSION')
export class CorporateEmissionEntity
  extends BaseEntity
  implements ICorporateEmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: CorporateEmissionType;

  @Column({ name: 'company_id' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company!: CompanyEntity;

  @Column()
  year!: number;

  @Column({ name: 'scope_1', type: 'float' })
  scope1!: number;

  @Column({ name: 'scope_2', type: 'float' })
  scope2!: number;

  @Column({ name: 'scope_3', nullable: true, type: 'float' })
  scope3?: number | null;

  @Column({ name: 'scope_2_type', nullable: false, type: 'varchar' })
  scope2Type!: Scope2Type;

  @Column({ nullable: true, type: 'float' })
  offset?: number | null;

  @Column({ name: 'example_percentage', nullable: true, type: 'float' })
  examplePercentage?: number | null;

  @Column({ name: 'head_count', nullable: true, type: 'int' })
  headCount?: number | null;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @Column({
    name: 'verification_file_id',
    nullable: true,
    type: 'uniqueidentifier',
  })
  verificationFileId?: string | null;

  @OneToOne(() => FileEntity)
  @JoinColumn({ name: 'verification_file_id', referencedColumnName: 'id' })
  verificationFile?: FileEntity | null;

  @OneToOne(
    () => CorporateEmissionAccessEntity,
    (access) => access.corporateEmissionAccess
  )
  corporateEmissionAccess!: CorporateEmissionAccessEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdByUser!: UserEntity;

  @Column({ name: 'updated_by' })
  updatedBy?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updatedByUser?: UserEntity;

  @OneToMany(
    () => CarbonIntensityEntity,
    (carbonIntensity) => carbonIntensity.emission
  )
  carbonIntensities!: CarbonIntensityEntity[];

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
