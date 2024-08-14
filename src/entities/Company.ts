import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CompanyStatus } from '../types';
import { CarbonIntensityEntity } from './CarbonIntensity';
import { CompanyRelationshipRecommendationEntity } from './CompanyRelationshipRecommendation';
import { UserEntity } from './User';

@Entity('COMPANY')
export class CompanyEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name' })
  name!: string;

  @Column({
    name: 'dnb_duns',
    type: 'varchar',
    nullable: true,
  })
  duns?: string | null;

  @Column({
    name: 'dnb_region',
    type: 'nvarchar',
    nullable: true,
  })
  dnbRegion?: string | null;

  @Column({
    name: 'dnb_country_name',
    type: 'varchar',
    nullable: true,
  })
  dnbCountry?: string | null;

  @Column({
    name: 'dnb_country_iso_code',
    type: 'varchar',
    nullable: true,
  })
  dnbCountryIso?: string | null;

  @Column({
    name: 'dnb_postal_code',
    type: 'varchar',
    nullable: true,
  })
  dnbPostalCode?: string | null;

  @Column({
    name: 'dnb_address_line_one',
    type: 'varchar',
    nullable: true,
  })
  dnbAddressLineOne?: string | null;

  @Column({
    name: 'dnb_address_line_two',
    type: 'varchar',
    nullable: true,
  })
  dnbAddressLineTwo?: string | null;

  @Column({ name: 'location', type: 'varchar' })
  location?: string | null;

  @Column({
    name: 'business_sector',
    type: 'varchar',
    nullable: true,
  })
  businessSection?: string | null;

  @Column({
    name: 'sub_sector',
    type: 'varchar',
    nullable: true,
  })
  subSector?: string | null;

  @Column({ type: 'varchar' })
  status!: CompanyStatus;

  @Column({
    name: 'reviewed_by',
    type: 'uniqueidentifier',
    nullable: true,
  })
  reviewedBy?: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'reviewed_by',
    referencedColumnName: 'id',
  })
  reviewedByUser?: UserEntity;

  @Column({
    name: 'updated_by',
    type: 'uniqueidentifier',
    nullable: true,
  })
  updatedBy?: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updatedByUser?: UserEntity;

  @Column({
    name: 'created_by',
    type: 'uniqueidentifier',
    nullable: true,
  })
  createdBy?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdByUser?: UserEntity;

  @Column({
    name: 'reviewed_at',
    type: 'datetime',
    nullable: true,
  })
  reviewedAt?: Date;

  @OneToMany(() => UserEntity, (user) => user.company)
  users!: UserEntity[];

  @OneToMany(
    () => CompanyRelationshipRecommendationEntity,
    (crr) => crr.recommendedCompanyDuns
  )
  companyRelationshipRecommendations!: CompanyRelationshipRecommendationEntity[];

  @OneToMany(
    () => CarbonIntensityEntity,
    (carbonIntensity) => carbonIntensity.company
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
  readonly updatedAt?: Date;

  @Column({
    name: 'hubspot_id',
    nullable: true,
    unique: true,
    type: 'varchar',
  })
  hubspotId?: string;
}
