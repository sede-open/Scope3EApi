import {
  BatchConvertIdentifierToAllKnownIdentifiers,
  IdentifierType,
  SAndPIdentifierType,
} from '../../clients/SAndPClient/types';
import { S_AND_P_DATA_UNAVAILABLE_ERROR_MESSAGE } from '../../clients/SAndPClient/constants';
import { CompanyIdentifierWithAllKnownIdentifiers } from './types';

export interface GroupedCompanyIdentifierData {
  records: BatchConvertIdentifierToAllKnownIdentifiers[];
  dataUnavailable: BatchConvertIdentifierToAllKnownIdentifiers[];
  otherErrors: BatchConvertIdentifierToAllKnownIdentifiers[];
}

export function groupCompanyIdentifierData(
  companyIdentifierData: BatchConvertIdentifierToAllKnownIdentifiers[]
): GroupedCompanyIdentifierData {
  const {
    records,
    dataUnavailable,
    otherErrors,
  } = companyIdentifierData.reduce(
    (acc: GroupedCompanyIdentifierData, record) => {
      if (record.error === S_AND_P_DATA_UNAVAILABLE_ERROR_MESSAGE) {
        acc.dataUnavailable.push(record);
        return acc;
      } else if (record.error) {
        acc.otherErrors.push(record);
        return acc;
      }
      acc.records.push(record);
      return acc;
    },
    {
      records: [],
      dataUnavailable: [],
      otherErrors: [],
    }
  );

  return { records, dataUnavailable, otherErrors };
}

/**
 * The application / quick connect service needs to do various exchanges back and forth
 * between Duns ID and CIQ ID. Each time we do this we have to query all identifiers
 * and then pick out either the CIQ or the Duns.
 *
 * This function is a way of taking a list of all known identifiers and converting
 * into a higher level object which structures the CIQ ID + Duns ID in a more accessible
 * format called 'CompanyIdentifier'.
 */

export function extractCompanyIdentifiersFromAllKnownIdentifiers<
  T extends BatchConvertIdentifierToAllKnownIdentifiers
>(records: T[]): CompanyIdentifierWithAllKnownIdentifiers[] {
  return records.reduce(
    (acc: CompanyIdentifierWithAllKnownIdentifiers[], record) => {
      const firstRecord = record.identities && record.identities[0];
      const ciqId = firstRecord?.companyId;
      const name = firstRecord?.companyName;

      const dunsIdentityRecord = record.identities?.find(
        ({ identifierType }) => identifierType === SAndPIdentifierType.DUNS
      );

      /** There are a number of records in S&P where the Duns number is not listed in the known
       * identities response, so in this case we can fallback to the data we have locally
       * which we know is linked.
       */
      const remoteDuns = dunsIdentityRecord?.identifierValue;
      const localDuns =
        record.identifierType === IdentifierType.DUNS
          ? record.identifier
          : undefined;

      const duns = localDuns ?? remoteDuns;

      return ciqId && name ? [...acc, { ...record, ciqId, duns, name }] : acc;
    },
    []
  );
}

import { CompanyRelationshipRecommendationStatus } from '../../types';
import { VALID_COMPANY_RELATIONSHIP_RECOMMENDATION_STATUS_TRANSITIONS } from './constants';

export const recommendationStatusChangeIsValid = (
  currentStatus: CompanyRelationshipRecommendationStatus,
  newStatus: CompanyRelationshipRecommendationStatus
): boolean =>
  VALID_COMPANY_RELATIONSHIP_RECOMMENDATION_STATUS_TRANSITIONS[
    currentStatus
  ].includes(newStatus);
