import {
  CompanyRelationshipRecommendation,
  MutationUpdateCompanyRelationshipRecommendationStatusArgs,
  QueryCompanyRelationshipRecommendationsArgs,
} from '../types';
import { ResolverFunction } from './types';

type CompanyRelationshipRecommendationResolverType = {
  Query: {
    companyRelationshipRecommendations: ResolverFunction<
      QueryCompanyRelationshipRecommendationsArgs,
      CompanyRelationshipRecommendation[]
    >;
  };
  Mutation: {
    updateCompanyRelationshipRecommendationStatus: ResolverFunction<
      MutationUpdateCompanyRelationshipRecommendationStatusArgs,
      string
    >;
  };
};

export const companyRelationshipRecommendationResolvers: CompanyRelationshipRecommendationResolverType = {
  Query: {
    companyRelationshipRecommendations(
      _,
      { companyId, relationshipTypes, recommendationStatuses },
      context
    ) {
      return context.controllers.companyRelationshipRecommendations.getRecommendationsWithDuns(
        { companyId, relationshipTypes, recommendationStatuses }
      );
    },
  },
  Mutation: {
    async updateCompanyRelationshipRecommendationStatus(
      _,
      { id, status },
      context
    ) {
      return context.controllers.companyRelationshipRecommendations.updateStatus(
        { id, status },
        context
      );
    },
  },
};
