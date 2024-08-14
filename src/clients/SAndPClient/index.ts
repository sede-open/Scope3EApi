import fetch from 'node-fetch';
import { CompanyRelationshipType } from '../../types';
import { FetchOptions } from '../types';
import {
  BatchConvertIdentifierToAllKnownIdentifiers,
  BecrsEntityBaseResponse,
  IdentifierType,
  CiqRelationshipData,
} from './types';
import {
  getIdentifierFormatterFunction,
  getTaggedCiqId,
  removeTagFromCiqId,
} from './utils';

/** Lots of supporting information for this API can be found in this confluence document:
 * https://atlassian.net/wiki/spaces/APP/pages/3635544123/Quick+connect+with+other+companies
 */
export class SAndPClient {
  private clientServiceApi = '';

  constructor(private readonly token: string) {}

  private async clientServiceRequest({
    body,
    headers,
    queryParams,
  }: FetchOptions<unknown> = {}) {
    const searchParams = new URLSearchParams(queryParams);

    const res = await fetch(`${this.clientServiceApi}?${searchParams}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Charset: 'utf-8',
        Authorization: `Basic ${this.token}`,
        ...(headers ? headers : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message;
      try {
        const resp = await res.json();
        message = resp.message;
      } catch {
        message = res.statusText;
      }
      throw new Error(message);
    }

    try {
      return await res.json();
    } catch (error) {
      // Delete request does not respond with json
      return;
    }
  }

  async batchGetAllKnownIdentifiersFromType(
    identifiers: string[],
    type: IdentifierType
  ): Promise<BecrsEntityBaseResponse> {
    const identifierFormatterFunction = getIdentifierFormatterFunction(type);

    return this.clientServiceRequest({
      body: {
        inputRequests: identifiers.map((identifier) => ({
          Function: 'GDSPV',
          Identifier: identifierFormatterFunction(identifier),
          Mnemonic: 'BECRS_ENTITY_BASE',
          Properties: {},
        })),
      },
    });
  }

  async batchConvertIdentifierToAllKnownIdentifiers(
    identifiers: string[],
    identifierType: IdentifierType
  ): Promise<BatchConvertIdentifierToAllKnownIdentifiers[]> {
    const {
      GDSSDKResponse: responses,
    } = await this.batchGetAllKnownIdentifiersFromType(
      identifiers,
      identifierType
    );

    return responses.map(({ ErrMsg: errorMessage, Rows: rows }, index) => {
      if (errorMessage) {
        return {
          identities: null,
          error: errorMessage,
          identifier: identifiers[index],
          identifierType,
        };
      }

      return {
        identities:
          rows?.map(
            ({
              /* The order of these records is hardcoded -- you can check the order by looking at the Headers object on the response */
              Row: [
                companyId,
                companyName,
                identifierType,
                identifierValue,
                activeFlag,
                primaryFlag,
              ],
            }) => ({
              companyId,
              companyName,
              identifierType,
              identifierValue,
              activeFlag,
              primaryFlag,
            })
          ) ?? [],
        error: null,
        identifier: identifiers[index],
        identifierType,
      };
    });
  }

  async getCustomersByCiqIdRaw(ciqId: string) {
    const taggedCiqId = getTaggedCiqId(ciqId);
    const response = await this.clientServiceRequest({
      body: {
        inputRequests: [
          {
            Function: 'GDSHE',
            Identifier: taggedCiqId,
            Mnemonic: 'IQ_CUSTOMER_CURR_ID',
            Properties: {},
          },
          {
            Function: 'GDSHE',
            Identifier: taggedCiqId,
            Mnemonic: 'IQ_CUSTOMER_CURR',
            Properties: {},
          },
          {
            Function: 'GDSHE',
            Identifier: taggedCiqId,
            Mnemonic: 'IQ_CUSTOMER_CURR_REL',
            Properties: {},
          },
        ],
      },
    });
    return response;
  }

  async getSuppliersByCiqIdRaw(ciqId: string) {
    const taggedCiqId = getTaggedCiqId(ciqId);
    return this.clientServiceRequest({
      body: {
        inputRequests: [
          {
            Function: 'GDSHE',
            Identifier: taggedCiqId,
            Mnemonic: 'IQ_SUPPLIER_CURR_ID',
            Properties: {},
          },
          {
            Function: 'GDSHE',
            Identifier: taggedCiqId,
            Mnemonic: 'IQ_SUPPLIER_CURR',
            Properties: {},
          },
          {
            Function: 'GDSHE',
            Identifier: taggedCiqId,
            Mnemonic: 'IQ_SUPPLIER_CURR_REL',
            Properties: {},
          },
        ],
      },
    });
  }

  async getCustomersByCiqId(ciqId: string): Promise<CiqRelationshipData[]> {
    const {
      GDSSDKResponse: [
        iqCustomerCurrIdResponse,
        iqCustomerCurrResponse,
        iqCustomerCurrRelationshipResponse,
      ],
    } = await this.getCustomersByCiqIdRaw(ciqId);

    const zippedResults = iqCustomerCurrIdResponse.Rows.map(
      (response: Record<string, any>, index: number) => {
        const customerCiqId = response.Row[0];
        const companyName = iqCustomerCurrResponse.Rows[index].Row[0];
        const externalRelationshipType =
          iqCustomerCurrRelationshipResponse.Rows[index].Row[0];

        return {
          ciqId: removeTagFromCiqId(customerCiqId),
          companyName,
          externalRelationshipType,
          nativeRelationshipType: CompanyRelationshipType.Customer,
        };
      }
    );

    return zippedResults;
  }

  async getSuppliersByCiqId(ciqId: string): Promise<CiqRelationshipData[]> {
    const {
      GDSSDKResponse: [
        iqSupplierCurrIdResponse,
        iqSupplierCurrResponse,
        iqSupplierCurrRelationshipResponse,
      ],
    } = await this.getSuppliersByCiqIdRaw(ciqId);

    const zippedResults = iqSupplierCurrIdResponse.Rows.map(
      (response: Record<string, any>, index: number) => {
        const supplier = response.Row[0];
        const companyName = iqSupplierCurrResponse.Rows[index].Row[0];
        const externalRelationshipType =
          iqSupplierCurrRelationshipResponse.Rows[index].Row[0];

        return {
          ciqId: removeTagFromCiqId(supplier),
          companyName,
          externalRelationshipType,
          nativeRelationshipType: CompanyRelationshipType.Supplier,
        };
      }
    );

    return zippedResults;
  }
}
