import { ICompanyRelationshipRecommendation } from '../repositories/CompanyRelationshipRecommendationRepository/types';
import {
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
} from '../types';

export const createCompanyRelationshipRecommendationMock = (
  data: Partial<ICompanyRelationshipRecommendation> & {
    id: string;
    recommendationForCompanyId: string;
  }
): ICompanyRelationshipRecommendation => ({
  recommendedCompanyDuns: '407067680',
  recommendedCompanyCiqId: '121212121',
  externalRelationshipType: 'Distributor',
  nativeRelationshipType: CompanyRelationshipType.Customer,
  recommendationStatus: CompanyRelationshipRecommendationStatus.Unacknowledged,
  companyName: 'Some company',
  reviewedBy: undefined,
  reviewedAt: undefined,
  isDeletedInDnB: false,
  region: 'Europe',
  country: 'United Kingdom',
  sector: 'Agriculture',
  ...data,
});
