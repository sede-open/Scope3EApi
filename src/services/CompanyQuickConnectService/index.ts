import { chunk } from 'lodash';
import { SAndPClient } from '../../clients/SAndPClient';
import { S_AND_P_MAX_REQUEST_PARAMS } from '../../clients/SAndPClient/constants';
import {
  CiqRelationshipData,
  IdentifierType,
} from '../../clients/SAndPClient/types';

import { CompanyRelationshipRecommendationRepository } from '../../repositories/CompanyRelationshipRecommendationRepository';
import {
  ICompanyRelationshipRecommendation,
  IFindRecommendation,
  IFindRecommendationsWithDuns,
  ISaveRecommendationBusinessData,
} from '../../repositories/CompanyRelationshipRecommendationRepository/types';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import { CompanyRelationshipRecommendationStatus } from '../../types';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import {
  CompanyIdentifier,
  CompanyIdentifierWithAllKnownIdentifiers,
  CompanyRelationshipRecommendationData,
  IUpdateRecommendation,
} from './types';
import {
  groupCompanyIdentifierData,
  extractCompanyIdentifiersFromAllKnownIdentifiers,
  recommendationStatusChangeIsValid,
} from './utils';

export class CompanyQuickConnectService {
  constructor(
    public databaseService: DatabaseService,
    protected sAndPClient: SAndPClient,
    protected companyRelationshipRecommendationRepository: CompanyRelationshipRecommendationRepository
  ) {}

  async getCompaniesWithDuns() {
    const companyRepository = await this.databaseService.getRepository(
      CompanyRepository
    );
    return companyRepository.companiesWithDuns();
  }

  async getCompanyIdentifierDataFromDuns<T extends { duns: string }>(
    data: T[]
  ) {
    const chunks = chunk(data, S_AND_P_MAX_REQUEST_PARAMS);
    const response = await Promise.all(
      chunks.map((chunk) =>
        this.sAndPClient.batchConvertIdentifierToAllKnownIdentifiers(
          chunk.map((company) => company.duns),
          IdentifierType.DUNS
        )
      )
    );

    return groupCompanyIdentifierData(response.flat());
  }

  async getCompanyIdentifierDataFromCiq(
    data: CiqRelationshipData[]
  ): Promise<CompanyIdentifierWithAllKnownIdentifiers[]> {
    const chunks = chunk(data, S_AND_P_MAX_REQUEST_PARAMS);

    const response = await Promise.all(
      chunks.map((chunk) =>
        this.sAndPClient.batchConvertIdentifierToAllKnownIdentifiers(
          chunk.map((company) => company.ciqId),
          IdentifierType.CIQ_ID
        )
      )
    );

    const flattened = groupCompanyIdentifierData(response.flat());

    const linked = flattened.records.map((identifierData, index) => ({
      ...identifierData,
      externalRelationshipType: data[index].externalRelationshipType,
      nativeRelationshipType: data[index].nativeRelationshipType,
    }));

    return extractCompanyIdentifiersFromAllKnownIdentifiers(linked);
  }

  async enrichCompanyIdentifiersWithCompanyRelationshipData(
    companyIdentifiers: CompanyIdentifier[]
  ): Promise<CompanyRelationshipRecommendationData[]> {
    return Promise.all(
      companyIdentifiers.map(async (companyIdentifier) => {
        const [customerDataWithCiq, supplierDataWithCiq] = await Promise.all([
          this.sAndPClient.getCustomersByCiqId(companyIdentifier.ciqId),
          this.sAndPClient.getSuppliersByCiqId(companyIdentifier.ciqId),
        ]);

        const suggestedRelationships = await this.getCompanyIdentifierDataFromCiq(
          [...customerDataWithCiq, ...supplierDataWithCiq]
        );

        return {
          ...companyIdentifier,
          suggestedRelationships,
        };
      })
    );
  }

  async saveCompanyRecommendation(
    recommendation: CompanyRelationshipRecommendationData
  ) {
    const metadata = { created: 0, duplicate: 0 };
    const companyRepository = await this.databaseService.getRepository(
      CompanyRepository
    );

    if (!recommendation.duns) {
      return metadata;
    }

    const companiesMap = await companyRepository.dunsNumbersToCompanyIdsAsMap([
      recommendation.duns,
    ]);

    const companyId = companiesMap[recommendation.duns];

    if (!companyId) {
      return metadata;
    }

    for await (const suggestedRelationship of recommendation.suggestedRelationships) {
      if (
        !suggestedRelationship.externalRelationshipType ||
        !suggestedRelationship.nativeRelationshipType
      ) {
        continue;
      }

      /**
       * It is not ideal to be doing single record inserts here, but MSSQL does not have a
       * simple way to multi-insert and handle duplicate key errors.
       */
      const id = await this.companyRelationshipRecommendationRepository.insertAndIgnoreDuplicates(
        {
          recommendationForCompanyId: companyId,
          recommendedCompanyCiqId: suggestedRelationship.ciqId,
          recommendedCompanyDuns: suggestedRelationship.duns,
          externalRelationshipType:
            suggestedRelationship.externalRelationshipType,
          nativeRelationshipType: suggestedRelationship.nativeRelationshipType,
          recommendationStatus:
            CompanyRelationshipRecommendationStatus.Unacknowledged,
          companyName: suggestedRelationship.name,
          isDeletedInDnB: false,
        }
      );

      if (id) {
        metadata.created += 1;
      } else {
        metadata.duplicate += 1;
      }
    }

    return metadata;
  }

  async updateRecommendation({
    id,
    currentStatus,
    newStatus,
    reviewedBy,
  }: IUpdateRecommendation) {
    if (!recommendationStatusChangeIsValid(currentStatus, newStatus)) {
      throw new Error(
        `Cannot transition from ${currentStatus} status to ${newStatus} status`
      );
    }

    await this.companyRelationshipRecommendationRepository.update(
      { id },
      {
        id,
        recommendationStatus: newStatus,
        reviewedBy,
        reviewedAt: new Date(),
      }
    );
  }

  async findRecommendation(
    data: IFindRecommendation
  ): Promise<ICompanyRelationshipRecommendation | undefined> {
    return this.companyRelationshipRecommendationRepository.findRecommendation(
      data
    );
  }

  async findRecommendationsWithTargetCompanyData({
    companyId,
    relationshipTypes,
    recommendationStatuses,
  }: IFindRecommendationsWithDuns) {
    return this.companyRelationshipRecommendationRepository.findRecommendationsWithTargetCompanyData(
      { companyId, relationshipTypes, recommendationStatuses }
    );
  }

  async findRecommendationsMissingBusinessData() {
    return this.companyRelationshipRecommendationRepository.findRecommendationsMissingBusinessData();
  }

  async saveRecommendationBusinessData({
    id,
    country,
    region,
    sector,
  }: ISaveRecommendationBusinessData) {
    return this.companyRelationshipRecommendationRepository.update(
      { id },
      {
        country,
        region,
        sector,
      }
    );
  }

  async markRecommendationsWithDeletedDuns(dunsNumbers: string[]) {
    if (!dunsNumbers.length) {
      return;
    }
    return this.companyRelationshipRecommendationRepository.setIsDeletedInDnB(
      dunsNumbers
    );
  }
}
