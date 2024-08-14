import { v4 as uuidV4 } from 'uuid';
import { Connection, In } from 'typeorm';
import { CompanyRelationshipRecommendationRepository } from '.';
import { teardownPreviousDbState } from '../../../jest.integration.setup';
import { getOrCreateConnection } from '../../dbConnection';
import { createCompanyMock } from '../../mocks/company';
import { CompanyRepository } from '../CompanyRepository';
import { createCompanyRelationshipRecommendationMock } from '../../mocks/companyRelationshipRecommendation';
import {
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
  CompanyStatus,
} from '../../types';

describe('CompanyRelationshipRepository', () => {
  let connection: Connection;
  let companyRepository: CompanyRepository;
  let companyRelationshipRecommendationRepository: CompanyRelationshipRecommendationRepository;

  const companyBeingRecommendedId = uuidV4().toUpperCase();

  const companyRecommendationId1 = uuidV4().toUpperCase();
  const companyThatHasBeenRecommendedId = uuidV4().toUpperCase();
  const companyThatHasBeenRecommendedDuns = '123456789';
  const companyThatHasBeenRecommendedCompanyName = 'ABC Inc.';

  const companyRecommendationId2 = uuidV4().toUpperCase();
  const anotherRecommendationDuns = '987654321';

  const companyRecommendationId3 = uuidV4().toUpperCase();

  const setup = async () => {
    await companyRepository.save([
      createCompanyMock({
        id: companyBeingRecommendedId,
        dnbCountry: 'UK',
        dnbCountryIso: undefined,
        status: CompanyStatus.Active,
      }),
      createCompanyMock({
        id: companyThatHasBeenRecommendedId,
        duns: companyThatHasBeenRecommendedDuns,
        dnbCountry: undefined,
        dnbCountryIso: undefined,
      }),
    ]);

    await companyRelationshipRecommendationRepository.save([
      /* A recommendation where the duns number already exists on a record in the COMPANY table, ie an existing company being recommended */
      createCompanyRelationshipRecommendationMock({
        id: companyRecommendationId1,
        recommendationForCompanyId: companyBeingRecommendedId,
        recommendedCompanyDuns: companyThatHasBeenRecommendedDuns,
        recommendedCompanyCiqId: `CIQ-${companyThatHasBeenRecommendedDuns}-1`,
        nativeRelationshipType: CompanyRelationshipType.Supplier,
        recommendationStatus:
          CompanyRelationshipRecommendationStatus.Unacknowledged,
        companyName: companyThatHasBeenRecommendedCompanyName,
        region: undefined,
        country: undefined,
        sector: undefined,
      }),
      /* A recommendation where the recommended duns number is not in the DB, ie a new company */
      createCompanyRelationshipRecommendationMock({
        id: companyRecommendationId2,
        recommendationForCompanyId: companyBeingRecommendedId,
        recommendedCompanyDuns: anotherRecommendationDuns,
        recommendedCompanyCiqId: `CIQ-${companyThatHasBeenRecommendedDuns}-2`,
        nativeRelationshipType: CompanyRelationshipType.Customer,
        recommendationStatus: CompanyRelationshipRecommendationStatus.Accepted,
        region: undefined,
        country: undefined,
        sector: undefined,
      }),
    ]);
  };

  const teardown = async () => {
    await teardownPreviousDbState(connection);
    await companyRelationshipRecommendationRepository.delete([
      companyRecommendationId1,
      companyRecommendationId2,
      companyRecommendationId3,
    ]);
    await companyRepository.delete([
      companyBeingRecommendedId,
      companyThatHasBeenRecommendedId,
    ]);
  };

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = connection.getCustomRepository(CompanyRepository);
    companyRelationshipRecommendationRepository = connection.getCustomRepository(
      CompanyRelationshipRecommendationRepository
    );
  });

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    await teardown();
    await setup();
  });

  describe('insertAndIgnoreDuplicates', () => {
    it('should silently continue if we insert a duplicate record', async () => {
      /* Note we are copying the input parameters for companyRecommendationId1, creating duplicate key error */
      const result = await companyRelationshipRecommendationRepository.insertAndIgnoreDuplicates(
        {
          recommendationForCompanyId: companyBeingRecommendedId,
          recommendedCompanyDuns: companyThatHasBeenRecommendedDuns,
          recommendedCompanyCiqId: `CIQ-${companyThatHasBeenRecommendedDuns}-1`,
          externalRelationshipType: 'Distributor',
          nativeRelationshipType: CompanyRelationshipType.Supplier,
          companyName: companyThatHasBeenRecommendedCompanyName,
          recommendationStatus:
            CompanyRelationshipRecommendationStatus.Unacknowledged,
          isDeletedInDnB: false,
        }
      );

      expect(result).toBeUndefined();
    });
  });

  describe('findRecommendationsWithTargetCompanyData', () => {
    describe('when the company recommendation is already on the platform', () => {
      it('should join the company relationship recommendation with the company', async () => {
        const record = await companyRelationshipRecommendationRepository.findRecommendationsWithTargetCompanyData(
          {
            companyId: companyBeingRecommendedId,
            /* Repository API is configured not to filter when no options provided */
            relationshipTypes: [],
            recommendationStatuses: [],
          }
        );

        expect(record).toHaveLength(2);
        expect(record).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: companyRecommendationId1,
              recommendationForCompanyId: companyBeingRecommendedId,
              nativeRelationshipType: CompanyRelationshipType.Supplier,
              recommendationStatus:
                CompanyRelationshipRecommendationStatus.Unacknowledged,
              recommendedCompanyDuns: companyThatHasBeenRecommendedDuns,
              recommendedCompanyId: companyThatHasBeenRecommendedId,
            }),
            expect.objectContaining({
              id: companyRecommendationId2,
              recommendationForCompanyId: companyBeingRecommendedId,
              nativeRelationshipType: CompanyRelationshipType.Customer,
              recommendationStatus:
                CompanyRelationshipRecommendationStatus.Accepted,
              recommendedCompanyDuns: anotherRecommendationDuns,
              /* Company did not exist, so these are null */
              recommendedCompanyId: null,
              companyStatus: null,
            }),
          ])
        );
      });

      it('should filter by relationship type when specified', async () => {
        const record = await companyRelationshipRecommendationRepository.findRecommendationsWithTargetCompanyData(
          {
            companyId: companyBeingRecommendedId,
            relationshipTypes: [CompanyRelationshipType.Customer],
            recommendationStatuses: [],
          }
        );

        expect(record).toHaveLength(1);
        expect(record).toEqual([
          expect.objectContaining({
            id: companyRecommendationId2,
            recommendationForCompanyId: companyBeingRecommendedId,
            nativeRelationshipType: CompanyRelationshipType.Customer,
            recommendationStatus:
              CompanyRelationshipRecommendationStatus.Accepted,
            recommendedCompanyDuns: anotherRecommendationDuns,
            /* Company did not exist, so these are null */
            recommendedCompanyId: null,
            companyStatus: null,
          }),
        ]);
      });

      it('should filter by recommendation status when specified', async () => {
        const record = await companyRelationshipRecommendationRepository.findRecommendationsWithTargetCompanyData(
          {
            companyId: companyBeingRecommendedId,
            relationshipTypes: [],
            recommendationStatuses: [
              CompanyRelationshipRecommendationStatus.Unacknowledged,
            ],
          }
        );

        expect(record).toHaveLength(1);
        expect(record).toEqual([
          expect.objectContaining({
            id: companyRecommendationId1,
            recommendationForCompanyId: companyBeingRecommendedId,
            nativeRelationshipType: CompanyRelationshipType.Supplier,
            recommendationStatus:
              CompanyRelationshipRecommendationStatus.Unacknowledged,
            recommendedCompanyDuns: companyThatHasBeenRecommendedDuns,
            recommendedCompanyId: companyThatHasBeenRecommendedId,
          }),
        ]);
      });

      it('should should query location + sector data', async () => {
        await companyRelationshipRecommendationRepository.save([
          createCompanyRelationshipRecommendationMock({
            id: companyRecommendationId3,
            recommendationForCompanyId: companyBeingRecommendedId,
            recommendedCompanyDuns: `${anotherRecommendationDuns}-3`,
            recommendedCompanyCiqId: `CIQ-${companyThatHasBeenRecommendedDuns}-3`,
            nativeRelationshipType: CompanyRelationshipType.Customer,
            recommendationStatus:
              CompanyRelationshipRecommendationStatus.Unacknowledged,
            country: 'UK',
            region: 'London',
            sector: 'Aerospace',
          }),
        ]);

        const record = await companyRelationshipRecommendationRepository.findRecommendationsWithTargetCompanyData(
          {
            companyId: companyBeingRecommendedId,
            relationshipTypes: [CompanyRelationshipType.Customer],
            recommendationStatuses: [
              CompanyRelationshipRecommendationStatus.Unacknowledged,
            ],
          }
        );

        expect(record).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: companyRecommendationId3,
              country: 'UK',
              region: 'London',
              sector: 'Aerospace',
            }),
          ])
        );
      });
    });
  });

  describe('findRecommendation', () => {
    it('should allow the user to find a recommendation by ID', async () => {
      const record = await companyRelationshipRecommendationRepository.findRecommendation(
        { id: companyRecommendationId1 }
      );

      expect(record).toEqual(
        expect.objectContaining({
          id: companyRecommendationId1,
        })
      );
    });

    it('should allow the user to find a recommendation by duns + recommendationForCompanyId', async () => {
      const record = await companyRelationshipRecommendationRepository.findRecommendation(
        {
          recommendedCompanyDuns: companyThatHasBeenRecommendedDuns,
          recommendationForCompanyId: companyBeingRecommendedId,
          relationshipType: CompanyRelationshipType.Supplier,
        }
      );

      expect(record).toEqual(
        expect.objectContaining({
          recommendedCompanyDuns: companyThatHasBeenRecommendedDuns,
          recommendationForCompanyId: companyBeingRecommendedId,
        })
      );
    });
  });

  describe('findRecommendationsMissingBusinessData', () => {
    beforeEach(async () => {
      await companyRelationshipRecommendationRepository.save([
        /* A recommendation where the "business data" -- which is a (rubbish) name for the three data points: sector, region and county -- is already populated */
        createCompanyRelationshipRecommendationMock({
          id: companyRecommendationId3,
          recommendationForCompanyId: companyBeingRecommendedId,
          recommendedCompanyDuns: `${anotherRecommendationDuns}-3`,
          recommendedCompanyCiqId: `CIQ-${companyThatHasBeenRecommendedDuns}-3`,
          nativeRelationshipType: CompanyRelationshipType.Customer,
          recommendationStatus:
            CompanyRelationshipRecommendationStatus.Accepted,
          country: 'UK',
          region: 'London',
          sector: 'Aerospace',
        }),
      ]);
    });

    it('should return all recommendations that are missing business data', async () => {
      const records = await companyRelationshipRecommendationRepository.findRecommendationsMissingBusinessData();

      expect(records).toHaveLength(2);
      expect(records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: companyRecommendationId1,
          }),
          expect.objectContaining({
            id: companyRecommendationId2,
          }),
        ])
      );
      expect(records).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            id: companyRecommendationId3,
          }),
        ])
      );
    });
  });

  describe('setIsDeletedInDnB', () => {
    it('should set the isDeletedInDnB flag to true for duns numbers provided', async () => {
      await companyRelationshipRecommendationRepository.setIsDeletedInDnB([
        companyThatHasBeenRecommendedDuns,
      ]);

      const records = await companyRelationshipRecommendationRepository.find({
        id: In([companyRecommendationId1, companyRecommendationId2]),
      });

      expect(records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: companyRecommendationId1,
            isDeletedInDnB: true,
          }),
          expect.objectContaining({
            id: companyRecommendationId2,
            isDeletedInDnB: false,
          }),
        ])
      );
    });
  });
});
