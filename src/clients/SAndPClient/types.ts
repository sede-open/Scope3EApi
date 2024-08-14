/** Types in this file may not be exhaustive, and should be cross referenced against the documentation
 * described in https://atlassian.net/wiki/spaces/APP/pages/3635544123/Quick+connect+with+other+companies
 */

import { CompanyRelationshipType } from '../../types';

export enum IdentifierType {
  CIQ_ID = 'ciq_id',
  DUNS = 'duns',
}

/** Incomplete -- there's probably a lot of these */
export enum SAndPIdentifierType {
  DUNS = 'D&B DUNS',
  SNL = 'SNL Institution ID',
  LEI_US = 'LEI - DTCC - US',
  LEI_JPN = 'LEI - JPX - Japan',
  LEI_UK = 'LEI - LSE - UK',
  CMA = 'CMA EntityID',
  S_AND_P_GV_KEY = 'S&P GVKey',
  GV_KEY_MULTI_ISSUE_STRUCTURE_PRODUCT = 'GvKey - MultiIssue / Structure Product',
  GV_KEY_PRO_FORMA = 'GvKey - ProForma',
}

type ClientServiceApiFunctionType = 'GDSP' | 'GDSPV' | 'GDSG' | 'GDSHE';

type ClientServiceApiRow = {
  Row: string[];
};

export type GDSSDKRecord = {
  Function: ClientServiceApiFunctionType;
  Mnemonic: string;
  NumCols: number;
  NumRows: number;
  /* Empty string when null */
  ErrMsg: string;
  CacheExpiryTime: string;
  /* The number of records in here is equal to the NumCols value */
  Headers: string[];
  Rows?: ClientServiceApiRow[];
  Identifer: string;
  StartDate: string;
  EndDate?: string;
  Seniority: string;
  PrimaryFlag: string;
  Limit?: string;
};

export interface BecrsEntityBaseResponse {
  GDSSDKResponse: GDSSDKRecord[];
}

export interface CiqCustomerDataResponse {
  GDSSDKResponse: GDSSDKRecord[];
}

export type EntityBaseRecord = {
  companyId: string;
  companyName: string;
  identifierType: string;
  identifierValue: string;
  activeFlag: string;
  primaryFlag: string;
};

export interface BatchConvertIdentifierToAllKnownIdentifiers {
  identities: EntityBaseRecord[] | null;
  error: string | null;
  identifier: string;
  identifierType: IdentifierType;
}

export interface CiqRelationshipData {
  ciqId: string;
  companyName: string;
  externalRelationshipType: string;
  nativeRelationshipType: CompanyRelationshipType;
}
