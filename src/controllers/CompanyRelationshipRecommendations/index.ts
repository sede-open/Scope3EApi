import { ApolloError } from 'apollo-server-express';
import { IContext } from '../../apolloContext';
import { CompanyQuickConnectService } from '../../services/CompanyQuickConnectService';
import {
  CompanyRelationshipRecommendation,
  CompanyRelationshipType,
  CompanyStatus,
} from '../../types';
import { IGetRecommendationsWithDuns, IUpdateStatus } from './types';

export class CompanyRelationshipRecommendationController {
  constructor(private companyQuickConnectService: CompanyQuickConnectService) {}

  async getRecommendationsWithDuns({
    companyId,
    relationshipTypes,
    recommendationStatuses,
  }: IGetRecommendationsWithDuns): Promise<
    CompanyRelationshipRecommendation[]
  > {
    const recommendationsRaw = await this.companyQuickConnectService.findRecommendationsWithTargetCompanyData(
      { companyId, relationshipTypes, recommendationStatuses }
    );

    return recommendationsRaw
      .filter((recommendation) => {
        if (
          recommendation.nativeRelationshipType ===
            CompanyRelationshipType.Customer &&
          recommendation.customerRelationshipId
        ) {
          return false;
        }

        if (
          recommendation.nativeRelationshipType ===
            CompanyRelationshipType.Supplier &&
          recommendation.supplierRelationshipId
        ) {
          return false;
        }

        if (!recommendation.companyStatus) {
          return true;
        }

        return ![
          CompanyStatus.InvitationDeclined,
          CompanyStatus.PendingUserConfirmation,
          CompanyStatus.Vetoed,
        ].includes(recommendation.companyStatus);
      })
      .map((recommendation) => ({
        id: recommendation.id,
        duns: recommendation.recommendedCompanyDuns,
        recommendationStatus: recommendation.recommendationStatus,
        relationshipType: recommendation.nativeRelationshipType,
        name: recommendation.companyName,
        companyId: recommendation.recommendedCompanyId,
        sector: recommendation.sector,
        country: recommendation.country,
        region: recommendation.region,
      }));
  }

  async updateStatus(
    { id, status }: IUpdateStatus,
    context: IContext
  ): Promise<string> {
    const recommendation = await this.companyQuickConnectService.findRecommendation(
      { id }
    );

    if (!recommendation) {
      throw new ApolloError(
        `No CompanyRelationshipRecommendation found for ID: ${id}`
      );
    }

    await this.companyQuickConnectService.updateRecommendation({
      id,
      currentStatus: recommendation.recommendationStatus,
      newStatus: status,
      reviewedBy: context.user.id,
    });

    return id;
  }
}
