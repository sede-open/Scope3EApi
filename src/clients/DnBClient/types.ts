import { DnBAuthTokenResponse, DnBTypeaheadResult } from '../../types';

// https://directplus.documentation.dnb.com/html/resources/JSONSample_Search.html#typeahead-search
export type TypeaheadResultType = {
  transactionDetail: {
    transactionID: string;
    transactionTimestamp: string;
    inLanguage: string;
    serviceVersion: string;
  };
  inquiryDetail: {
    countryISOAlpha2Code: string;
    searchTerm: string;
  };
  candidatesReturnedQuantity: number;
  candidatesMatchedQuantity: number;
  searchCandidates: {
    displaySequence: number;
    organization: {
      duns: string;
      dunsControlStatus?: {
        isOutOfBusiness: boolean;
      };
      primaryName: string;
      primaryAddress?: {
        addressCountry?: {
          isoAlpha2Code: string;
        };
        streetAddress?: {
          line1: string;
        };
        addressLocality?: {
          name: string;
        };
        addressRegion?: {
          name: string;
        };
      };
      corporateLinkage?: {
        isBranch: false;
        globalUltimate?: {
          duns: string;
          primaryName: string;
        };
      };
      financials?: {
        yearlyRevenue?: {
          value: number;
          currency: string;
        }[];
      }[];
      tradeStyleNames?: {
        name: string;
        priority: number;
      }[];
      primaryIndustryCodes?: {
        usSicV4: string;
        usSicV4Description: string;
      }[];
    };
  }[];
};

// NOTE :: the following type is not complete.
// For full result example, see the documentation:
// https://directplus.documentation.dnb.com/openAPI.html?apiID=aassem
export type AASSEMDataPackCompanySector = {
  industryCode: string | null;
  industryDescription: string | null;
  typeDnBCode: number | null;
  typeDescription: string | null;
  sectorPercentage: number | null;
};

export enum NumberOfEmployeesType {
  CONSOLIDATED = 'Consolidated',
  INDIVIDUAL = 'Individual',
  HEADQUARTERS = 'Headquarters Only (Employs Here)',
}

export type NumberOfEmployeesResponse = {
  value: number;
  informationScopeDescription: NumberOfEmployeesType;
  informationScopeDnBCode: number;
  reliabilityDescription: string;
  reliabilityDnBCode: number;
  employeeCategories: [
    {
      employmentBasisDescription: string;
      employmentBasisDnBCode: number;
    }
  ];
};

export enum FinancialsType {
  CONSOLIDATED = 'Consolidated',
  INDIVIDUAL = 'Individual',
  ENTIRE_GROUP = 'Entire Group',
}

type YearlyRevenue = {
  value: number;
  currency: string;
};

export type FinancialsResponse = {
  financialStatementToDate: string;
  financialStatementDuration: null;
  informationScopeDescription: FinancialsType;
  informationScopeDnBCode: number;
  reliabilityDescription: string;
  reliabilityDnBCode: number;
  unitCode: string;
  yearlyRevenue: YearlyRevenue[];
};

export type CompanyByDunsResultType = {
  organization: {
    duns: string;
    primaryName: string;
    primaryAddress?: {
      addressCountry?: {
        name: string | null;
        isoAlpha2Code: string | null;
      };
      continentalRegion?: {
        name: string | null;
      };
      addressLocality?: {
        name: string | null;
      };
      minorTownName: string | null;
      addressRegion?: {
        name: string | null;
        abbreviatedName: string | null;
      };
      addressCounty?: {
        name: string | null;
      };
      postalCode: string | null;
      streetNumber: string | null;
      streetName: string | null;
      streetAddress?: {
        line1: string | null;
        line2: string | null;
      };
    };
    dnbAssessment?: {
      assignmentModel?: {
        globalUltimate?: {
          duns: string | null;
          employeeCount: number | null;
          salesAmount: number | null;
          familyTreeMembersCount: number | null;
          industrySectorsCount: number | null;
          primarySector?: AASSEMDataPackCompanySector;
          secondarySector?: AASSEMDataPackCompanySector;
        };
        domesticUltimate?: {
          duns: string | null;
          employeeCount: number | null;
          salesAmount: number | null;
          familyTreeMembersCount: number | null;
          industrySectorsCount: number | null;
          primarySector?: AASSEMDataPackCompanySector;
          secondarySector?: AASSEMDataPackCompanySector;
        };
      };
    };
    numberOfEmployees: NumberOfEmployeesResponse[];
    financials: FinancialsResponse[];
  };
};

export type DnBCompanySector = {
  industryCode: string | null | undefined;
  industryDescription: string | null | undefined;
  typeDescription: string | null | undefined;
};

export type DnBCompanyProfileType = {
  duns: string;
  name: string;
  countryName?: string | null;
  countryIso?: string | null;
  region?: string | null;
  postalCode?: string | null;
  addressLineOne?: string | null;
  addressLineTwo?: string | null;
  primarySector?: DnBCompanySector | null;
  secondarySector?: DnBCompanySector | null;
};

type DnBSector = {
  industryCode: string | null | undefined;
  industryDescription: string | null | undefined;
  typeDescription: string | null | undefined;
};

export type CompanyByDunsTransformed = {
  duns: string;
  name: string;
  countryName: string | null | undefined;
  countryIso: string | null | undefined;
  region: string | null | undefined;
  postalCode: string | null | undefined;
  addressLineOne: string | null | undefined;
  addressLineTwo: string | null | undefined;
  primarySector: DnBSector;
  secondarySector: DnBSector;
  usdOfRevenue: number | null;
  numberOfEmployees: number | null;
};

export interface IDnBClient {
  companyByDunsRequest(
    duns: string,
    token: string
  ): Promise<CompanyByDunsTransformed | null>;
  typeaheadRequest(
    searchTerm: string,
    token: string
  ): Promise<DnBTypeaheadResult[]>;
  generateAuthToken(): Promise<DnBAuthTokenResponse>;
}
