import { BatchConvertIdentifierToAllKnownIdentifiers } from '../../clients/SAndPClient/types';
import {
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
} from '../../types';

export interface CompanyIdentifier {
  ciqId: string;
  name: string;
  duns?: string;
  externalRelationshipType?: string;
  nativeRelationshipType?: CompanyRelationshipType;
}

export type CompanyIdentifierWithAllKnownIdentifiers = BatchConvertIdentifierToAllKnownIdentifiers &
  CompanyIdentifier;

export interface CompanyRelationshipRecommendationData
  extends CompanyIdentifier {
  suggestedRelationships: CompanyIdentifierWithAllKnownIdentifiers[];
}

export interface IUpdateRecommendation {
  id: string;
  currentStatus: CompanyRelationshipRecommendationStatus;
  newStatus: CompanyRelationshipRecommendationStatus;
  reviewedBy: string;
}
