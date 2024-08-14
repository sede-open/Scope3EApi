import { EntityRepository, In, IsNull, Not } from 'typeorm';
import { SQL_SERVER_DUPLICATE_KEY_ERROR_CODE } from '../constants';
import { CompanyRelationshipRecommendationEntity } from '../../entities/CompanyRelationshipRecommendation';
import { CustomRepository } from '../Repository';
import {
  ICompanyRelationshipRecommendation,
  ICompanyRelationshipRecommendationWithTargetCompanyData,
  IFindRecommendation,
  IFindRecommendationsWithDuns,
  IFindRecommendationTargetedLookupParams,
} from './types';
import { hasDataProperty } from '../../utils/hasDataProperty';
import { CompanyRelationshipType } from '../../types';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';

@EntityRepository(CompanyRelationshipRecommendationEntity)
export class CompanyRelationshipRecommendationRepository extends CustomRepository<
  CompanyRelationshipRecommendationEntity,
  ICompanyRelationshipRecommendation
> {
  async insertAndIgnoreDuplicates({
    recommendationForCompanyId,
    recommendedCompanyDuns,
    recommendedCompanyCiqId,
    externalRelationshipType,
    nativeRelationshipType,
    companyName,
    recommendationStatus,
    reviewedBy,
    reviewedAt,
    isDeletedInDnB = false,
  }: Omit<ICompanyRelationshipRecommendation, 'id'>) {
    try {
      const {
        identifiers: [{ id }],
      } = await this.insert({
        recommendationForCompanyId,
        recommendedCompanyDuns,
        recommendedCompanyCiqId,
        externalRelationshipType,
        nativeRelationshipType,
        recommendationStatus,
        companyName,
        reviewedBy,
        reviewedAt,
        isDeletedInDnB,
      });
      return id;
    } catch (error) {
      if (
        error.originalError.info.number === SQL_SERVER_DUPLICATE_KEY_ERROR_CODE
      ) {
        return;
      }

      throw error;
    }
  }

  async findRecommendationsWithTargetCompanyData({
    companyId,
    recommendationStatuses,
    relationshipTypes,
  }: IFindRecommendationsWithDuns): Promise<
    ICompanyRelationshipRecommendationWithTargetCompanyData[]
  > {
    const statusQuery = recommendationStatuses.length
      ? {
          recommendationStatus: In(recommendationStatuses),
        }
      : {};

    const relationshipTypesQuery = relationshipTypes.length
      ? { nativeRelationshipType: In(relationshipTypes) }
      : {};

    return (
      this.createQueryBuilder('crr')
        .select(
          `
            crr.id,
            crr.recommendation_for_company_id as recommendationForCompanyId,
            crr.recommended_company_duns as recommendedCompanyDuns,
            crr.recommended_company_ciq_id as recommendedCompanyCiqId,
            crr.external_relationship_type as externalRelationshipType,
            crr.native_relationship_type as nativeRelationshipType,
            crr.recommendation_status as recommendationStatus,
            crr.company_name as companyName,
            crr.reviewed_by as reviewedBy,
            crr.reviewed_at as reviewedAt,
            crr.region as region,
            crr.country as country,
            crr.sector as sector,
            company.id as recommendedCompanyId,
            company.status as companyStatus,
            cr_customer.id as customerRelationshipId,
            cr_supplier.id as supplierRelationshipId
          `
        )
        /* Is the recommended company already a Company in XYZ */
        .leftJoin(
          'company',
          'company',
          `crr.recommended_company_duns = company.dnb_duns`
        )
        /* Are these companies already connected as customer/supplier  */
        .leftJoin(
          CompanyRelationshipEntity,
          'cr_customer',
          `cr_customer.customer_id = company.id AND cr_customer.supplier_id = :companyId AND cr_customer.invite_type = '${CompanyRelationshipType.Customer}'`,
          { companyId }
        )
        .leftJoin(
          CompanyRelationshipEntity,
          'cr_supplier',
          `cr_supplier.supplier_id = company.id AND cr_supplier.customer_id = :companyId AND cr_supplier.invite_type = '${CompanyRelationshipType.Supplier}'`,
          { companyId }
        )
        .where({
          recommendationForCompanyId: companyId,
          recommendedCompanyDuns: Not(IsNull()),
          isDeletedInDnB: false,
          ...statusQuery,
          ...relationshipTypesQuery,
        })
        .getRawMany<ICompanyRelationshipRecommendationWithTargetCompanyData>()
    );
  }

  async findRecommendation(
    findOptions: IFindRecommendation
  ): Promise<ICompanyRelationshipRecommendation | undefined> {
    const whereQuery = hasDataProperty<IFindRecommendationTargetedLookupParams>(
      findOptions,
      'relationshipType'
    )
      ? {
          nativeRelationshipType: findOptions.relationshipType,
          recommendedCompanyDuns: findOptions.recommendedCompanyDuns,
          recommendationForCompanyId: findOptions.recommendationForCompanyId,
        }
      : { id: findOptions.id };

    return this.findOne({
      where: {
        ...whereQuery,
      },
    });
  }

  async findRecommendationsMissingBusinessData() {
    return this.createQueryBuilder('crr')
      .where(
        `
        crr.sector IS NULL
        AND crr.country IS NULL
        AND crr.region IS NULL
        AND crr.recommended_company_duns IS NOT NULL
        AND crr.is_deleted_in_dnb = 0
        `
      )
      .getMany() as Promise<
      (ICompanyRelationshipRecommendation & {
        recommendedCompanyDuns: string;
      })[]
    >;
  }

  async setIsDeletedInDnB(dunsNumbers: string[]) {
    return this.update(
      { recommendedCompanyDuns: In(dunsNumbers) },
      { isDeletedInDnB: true }
    );
  }
}
