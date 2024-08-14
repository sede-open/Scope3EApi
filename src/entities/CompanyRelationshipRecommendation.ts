import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  CompanyRelationshipType,
  CompanyRelationshipRecommendationStatus,
} from '../types';
import { CompanyEntity } from './Company';
import { UserEntity } from './User';

@Entity('COMPANY_RELATIONSHIP_RECOMMENDATION')
export class CompanyRelationshipRecommendationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'recommendation_for_company_id' })
  recommendationForCompanyId!: string;

  @Column({ name: 'recommended_company_duns' })
  recommendedCompanyDuns?: string;

  @Column({ name: 'recommended_company_ciq_id' })
  recommendedCompanyCiqId!: string;

  @Column({ name: 'external_relationship_type' })
  externalRelationshipType!: string;

  @Column({ name: 'native_relationship_type' })
  nativeRelationshipType!: CompanyRelationshipType;

  @Column({
    name: 'recommendation_status',
    default: CompanyRelationshipRecommendationStatus.Unacknowledged,
  })
  recommendationStatus!: CompanyRelationshipRecommendationStatus;

  @Column({
    name: 'company_name',
  })
  companyName!: string;

  @Column({
    name: 'region',
    type: 'varchar',
    nullable: true,
  })
  region?: string | null;

  @Column({
    name: 'country',
    type: 'varchar',
    nullable: true,
  })
  country?: string | null;

  @Column({
    name: 'sector',
    type: 'varchar',
    nullable: true,
  })
  sector?: string | null;

  @Column({
    name: 'is_deleted_in_dnb',
    type: 'bit',
    nullable: false,
    default: false,
  })
  isDeletedInDnB!: boolean;

  @Column({ name: 'reviewed_by' })
  reviewedBy?: string;

  @Column({ type: 'datetime', name: 'reviewed_at' })
  reviewedAt?: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reviewed_by', referencedColumnName: 'id' })
  reviewer?: UserEntity;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({
    name: 'recommendation_for_company_id',
    referencedColumnName: 'id',
  })
  recommendationFor!: CompanyEntity;

  @ManyToOne(() => CompanyEntity, { primary: false })
  @JoinColumn({
    name: 'recommended_company_duns',
    referencedColumnName: 'duns',
  })
  recommendedCompany?: CompanyEntity;
}
