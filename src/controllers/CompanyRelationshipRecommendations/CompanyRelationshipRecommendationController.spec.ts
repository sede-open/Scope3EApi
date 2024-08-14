import { v4 as uuidV4 } from 'uuid';
import { CompanyRelationshipRecommendationController } from '.';
import { IContext } from '../../apolloContext';
import { SAndPClient } from '../../clients/SAndPClient';
import { createCompanyRelationshipRecommendationMock } from '../../mocks/companyRelationshipRecommendation';
import { getCurrentUser } from '../../mocks/user';
import { CompanyRelationshipRecommendationRepository } from '../../repositories/CompanyRelationshipRecommendationRepository';
import { CompanyQuickConnectService } from '../../services/CompanyQuickConnectService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import {
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
} from '../../types';

const findRecommendationMock = jest.spyOn(
  CompanyQuickConnectService.prototype,
  'findRecommendation'
);

const findRecommendationsWithTargetCompanyDataMock = jest.spyOn(
  CompanyQuickConnectService.prototype,
  'findRecommendationsWithTargetCompanyData'
);

const updateRecommendationMock = jest.spyOn(
  CompanyQuickConnectService.prototype,
  'updateRecommendation'
);

describe('CompanyRelationshipRecommendationController', () => {
  const relationshipMockId = uuidV4();
  const companyId = uuidV4();
  const duns = uuidV4();
  const companyName = 'Some Company';

  const user = getCurrentUser({
    userOverrides: { companyId },
    companyOverrides: { id: companyId },
  });

  const mockContext = ({
    user,
  } as unknown) as IContext;

  const controller = new CompanyRelationshipRecommendationController(
    new CompanyQuickConnectService(
      (jest.fn() as unknown) as DatabaseService,
      (jest.fn() as unknown) as SAndPClient,
      (jest.fn() as unknown) as CompanyRelationshipRecommendationRepository
    )
  );

  afterEach(() => {
    findRecommendationMock.mockReset();
    updateRecommendationMock.mockReset();
    findRecommendationsWithTargetCompanyDataMock.mockReset();
  });

  describe('getRecommendationsWithDuns', () => {
    it('should pass in the input args to the getCommendationsWithDuns call', async () => {
      findRecommendationsWithTargetCompanyDataMock.mockResolvedValueOnce([
        {
          ...createCompanyRelationshipRecommendationMock({
            id: relationshipMockId,
            recommendationForCompanyId: companyId,
          }),
          recommendedCompanyDuns: duns,
        },
      ]);

      await controller.getRecommendationsWithDuns({
        companyId,
        relationshipTypes: [
          CompanyRelationshipType.Customer,
          CompanyRelationshipType.Supplier,
        ],
        recommendationStatuses: [
          CompanyRelationshipRecommendationStatus.Unacknowledged,
        ],
      });

      expect(findRecommendationsWithTargetCompanyDataMock).toHaveBeenCalledWith(
        {
          companyId,
          relationshipTypes: [
            CompanyRelationshipType.Customer,
            CompanyRelationshipType.Supplier,
          ],
          recommendationStatuses: [
            CompanyRelationshipRecommendationStatus.Unacknowledged,
          ],
        }
      );
    });

    it('should transform the raw recommendations from the database into a recommendation response', async () => {
      findRecommendationsWithTargetCompanyDataMock.mockResolvedValueOnce([
        {
          ...createCompanyRelationshipRecommendationMock({
            id: relationshipMockId,
            recommendationForCompanyId: companyId,
            companyName,
            country: 'US',
            sector: 'Agribusiness',
            region: 'North America',
          }),
          recommendedCompanyDuns: duns,
        },
      ]);

      const result = await controller.getRecommendationsWithDuns({
        companyId,
        relationshipTypes: [
          CompanyRelationshipType.Customer,
          CompanyRelationshipType.Supplier,
        ],
        recommendationStatuses: [
          CompanyRelationshipRecommendationStatus.Unacknowledged,
        ],
      });

      expect(result).toEqual([
        {
          companyId: undefined,
          duns,
          id: relationshipMockId,
          name: companyName,
          recommendationStatus:
            CompanyRelationshipRecommendationStatus.Unacknowledged,
          relationshipType: CompanyRelationshipType.Customer,
          country: 'US',
          sector: 'Agribusiness',
          region: 'North America',
        },
      ]);
    });
  });

  describe('updateStatus', () => {
    it('should throw an error if the recommendation does not exist', async () => {
      findRecommendationMock.mockResolvedValue(undefined);

      try {
        await controller.updateStatus(
          {
            id: relationshipMockId,
            status: CompanyRelationshipRecommendationStatus.Accepted,
          },
          mockContext
        );
      } catch (error) {
        expect(error.message).toEqual(
          `No CompanyRelationshipRecommendation found for ID: ${relationshipMockId}`
        );
      }

      expect.assertions(1);
    });

    it('should find a recommendation and then call update function with the input params', async () => {
      findRecommendationMock.mockResolvedValue(
        createCompanyRelationshipRecommendationMock({
          id: relationshipMockId,
          recommendationForCompanyId: companyId,
        })
      );

      await controller.updateStatus(
        {
          id: relationshipMockId,
          status: CompanyRelationshipRecommendationStatus.Accepted,
        },
        mockContext
      );

      expect(updateRecommendationMock).toHaveBeenCalledWith({
        id: relationshipMockId,
        currentStatus: CompanyRelationshipRecommendationStatus.Unacknowledged,
        newStatus: CompanyRelationshipRecommendationStatus.Accepted,
        reviewedBy: user.id,
      });
    });

    it('should return the id', async () => {
      findRecommendationMock.mockResolvedValue(
        createCompanyRelationshipRecommendationMock({
          id: relationshipMockId,
          recommendationForCompanyId: companyId,
        })
      );

      const result = await controller.updateStatus(
        {
          id: relationshipMockId,
          status: CompanyRelationshipRecommendationStatus.Accepted,
        },
        mockContext
      );

      expect(result).toEqual(relationshipMockId);
    });
  });
});
