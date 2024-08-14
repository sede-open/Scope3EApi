import {
  CompanyRelationshipType,
  CompanyRelationshipRecommendationStatus,
  CompanyStatus,
} from '../../types';

export interface ICompanyRelationshipRecommendation {
  id: string;
  recommendationForCompanyId: string;
  recommendedCompanyDuns?: string;
  recommendedCompanyCiqId: string;
  externalRelationshipType: string;
  nativeRelationshipType: CompanyRelationshipType;
  recommendationStatus: CompanyRelationshipRecommendationStatus;
  companyName: string;
  sector?: string | null;
  region?: string | null;
  country?: string | null;
  isDeletedInDnB: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export type ICompanyRelationshipRecommendationWhereDuns = ICompanyRelationshipRecommendation & {
  recommendedCompanyDuns: string;
};

export interface IFindRecommendationsWithDuns {
  companyId: string;
  relationshipTypes: CompanyRelationshipType[];
  recommendationStatuses: CompanyRelationshipRecommendationStatus[];
}

export type ICompanyRelationshipRecommendationWithTargetCompanyData = ICompanyRelationshipRecommendationWhereDuns & {
  recommendedCompanyId?: string;
  companyStatus?: CompanyStatus;
  customerRelationshipId?: string;
  supplierRelationshipId?: string;
};

export type IFindRecommendationIdLookupParams = { id: string };

export type IFindRecommendationTargetedLookupParams = {
  recommendedCompanyDuns: string;
  recommendationForCompanyId: string;
  relationshipType: CompanyRelationshipType;
};

export type IFindRecommendation =
  | IFindRecommendationIdLookupParams
  | IFindRecommendationTargetedLookupParams;

export interface ISaveRecommendationBusinessData {
  id: string;
  country?: string | null;
  region?: string | null;
  sector?: string | null;
}
