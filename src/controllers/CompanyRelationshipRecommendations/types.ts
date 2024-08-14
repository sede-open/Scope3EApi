import {
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
} from '../../types';

export interface IGetRecommendationsWithDuns {
  companyId: string;
  relationshipTypes: CompanyRelationshipType[];
  recommendationStatuses: CompanyRelationshipRecommendationStatus[];
}

export interface IUpdateStatus {
  id: string;
  status: CompanyRelationshipRecommendationStatus;
}
