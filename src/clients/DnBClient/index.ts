import fetch from 'node-fetch';
import { DnBApiError } from '../../errors/dnbApiError';
import { DnBAuthTokenResponse } from '../../types';
import { logger } from '../../utils/logger';
import { sleep } from '../../utils/sleep';
import {
  CompanyByDunsResultType,
  CompanyByDunsTransformed,
  FinancialsResponse,
  FinancialsType,
  IDnBClient,
  NumberOfEmployeesResponse,
  NumberOfEmployeesType,
  TypeaheadResultType,
} from './types';

export class DnBClient implements IDnBClient {
  constructor(private dnbApiKey: string, private dnbApiSecret: string) {}

  public async companyByDunsRequest(
    duns: string,
    authToken: string
  ): Promise<CompanyByDunsTransformed | null> {
    try {
      const response = await fetch(
        `${process.env.DNB_BY_DUNS_URL}/${duns}?productId=aassem&versionId=v1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Handling 429: Too many requests response
      // https://directplus.documentation.dnb.com/html/pages/UsingDplusAPIs.html#handle-too-many-requests-error
      if (response.status === 429) {
        const res = await response.json();
        logger.info(
          {
            msg: res.error.errorMessage,
            code: res.error.errorCode,
          },
          'D&B Rate limited, sleeping for 60 seconds.'
        );
        await sleep(60 * 1000);
        return this.companyByDunsRequest(duns, authToken);
      }

      if (!response.ok) {
        const res = await response.json();
        throw new DnBApiError(
          res.error.errorMessage,
          res.error.errorCode,
          duns
        );
      }

      const body: CompanyByDunsResultType = await response.json();

      return this.getCompanyByDunsResults(body);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  public async typeaheadRequest(searchTerm: string, authToken: string) {
    const searchParams = new URLSearchParams({ searchTerm });

    try {
      const response = await fetch(
        `${process.env.DNB_TYPEAHEAD_URL}?${searchParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error.errorMessage);
      }

      const body: TypeaheadResultType = await response.json();

      return this.getTypeaheadCompanyResults(body);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  private getConsolidatedUsdOfRevenue = (financials: FinancialsResponse[]) => {
    const consolidatedTypes = new Set([
      FinancialsType.CONSOLIDATED,
      FinancialsType.ENTIRE_GROUP,
    ]);

    const consolidatedFinancial = financials.find(
      ({ informationScopeDescription }) =>
        consolidatedTypes.has(informationScopeDescription)
    );

    if (!consolidatedFinancial) {
      return null;
    }

    const usdOfRevenue = consolidatedFinancial.yearlyRevenue.find(
      ({ currency }) => currency.toUpperCase() === 'USD'
    );

    if (!usdOfRevenue) {
      return null;
    }

    return usdOfRevenue.value;
  };

  private getConsolidatedNumberOfEmployees = (
    numberOfEmployees: NumberOfEmployeesResponse[]
  ) => {
    const consolidatedNumberOfEmployees = numberOfEmployees.find(
      ({ informationScopeDescription }) => {
        return (
          informationScopeDescription === NumberOfEmployeesType.CONSOLIDATED
        );
      }
    );
    if (!consolidatedNumberOfEmployees) {
      return null;
    }
    return consolidatedNumberOfEmployees.value;
  };

  private getCompanyByDunsResults({
    organization,
  }: CompanyByDunsResultType): CompanyByDunsTransformed | null {
    if (!organization) {
      return null;
    }

    return {
      duns: organization.duns,
      name: organization.primaryName,
      countryName: organization.primaryAddress?.addressCountry?.name,
      countryIso: organization.primaryAddress?.addressCountry?.isoAlpha2Code,
      region: organization.primaryAddress?.addressRegion?.name,
      postalCode: organization.primaryAddress?.postalCode,
      addressLineOne: organization.primaryAddress?.streetAddress?.line1,
      addressLineTwo: organization.primaryAddress?.streetAddress?.line2,
      primarySector: {
        industryCode:
          organization.dnbAssessment?.assignmentModel?.globalUltimate
            ?.primarySector?.industryCode,
        industryDescription:
          organization.dnbAssessment?.assignmentModel?.globalUltimate
            ?.primarySector?.industryDescription,
        typeDescription:
          organization.dnbAssessment?.assignmentModel?.globalUltimate
            ?.primarySector?.typeDescription,
      },
      secondarySector: {
        industryCode:
          organization.dnbAssessment?.assignmentModel?.globalUltimate
            ?.secondarySector?.industryCode,
        industryDescription:
          organization.dnbAssessment?.assignmentModel?.globalUltimate
            ?.secondarySector?.industryDescription,
        typeDescription:
          organization.dnbAssessment?.assignmentModel?.globalUltimate
            ?.secondarySector?.typeDescription,
      },
      usdOfRevenue: this.getConsolidatedUsdOfRevenue(organization.financials),
      numberOfEmployees: this.getConsolidatedNumberOfEmployees(
        organization.numberOfEmployees
      ),
    };
  }

  private getTypeaheadCompanyResults(body: TypeaheadResultType) {
    return body.searchCandidates.map((company) => {
      const duns = company.organization.duns;
      const primaryName = company.organization.primaryName;
      const globalUltimateDuns =
        company.organization.corporateLinkage?.globalUltimate?.duns;
      const globalUltimatePrimaryName =
        company.organization.corporateLinkage?.globalUltimate?.primaryName;
      const isGlobalUltimate =
        !globalUltimateDuns || globalUltimateDuns === duns;
      const addressLine1 =
        company.organization.primaryAddress?.streetAddress?.line1;
      const addressCountryIsoAlpha2Code =
        company.organization.primaryAddress?.addressCountry?.isoAlpha2Code;
      const addressRegionName =
        company.organization.primaryAddress?.addressRegion?.name;

      return {
        duns,
        primaryName,
        isGlobalUltimate,
        globalUltimateDuns,
        globalUltimatePrimaryName,
        addressLine1,
        addressCountryIsoAlpha2Code,
        addressRegionName,
      };
    });
  }

  public async generateAuthToken(): Promise<DnBAuthTokenResponse> {
    const basicAuth = Buffer.from(
      `${this.dnbApiKey}:${this.dnbApiSecret}`
    ).toString('base64');

    try {
      const response = await fetch(
        `${process.env.DNB_AUTH_URL}?candidateMaximumQuantity=25`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
          body: JSON.stringify({ grant_type: 'client_credentials' }),
        }
      );

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error.errorMessage);
      }

      return response.json();
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
