import { CompanyRelationshipRecommendationStatus } from '../../types';

export const VALID_COMPANY_RELATIONSHIP_RECOMMENDATION_STATUS_TRANSITIONS: Record<
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipRecommendationStatus[]
> = {
  [CompanyRelationshipRecommendationStatus.Unacknowledged]: [
    CompanyRelationshipRecommendationStatus.Accepted,
    CompanyRelationshipRecommendationStatus.Declined,
  ],
  [CompanyRelationshipRecommendationStatus.Accepted]: [],
  [CompanyRelationshipRecommendationStatus.Declined]: [],
};
