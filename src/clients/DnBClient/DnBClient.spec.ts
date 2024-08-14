import fetch from 'node-fetch';
import { typeaheadSearchResultMock } from '../../mocks/dnbTypeaheadSearchResult';
import { dnbTokenMock } from '../../mocks/appMeta';
import { DnBClient } from '.';
import { FinancialsType, NumberOfEmployeesType } from './types';

jest.mock('node-fetch');

describe('DnBClient', () => {
  beforeAll(() => {
    process.env.DNB_AUTH_URL = 'https://some.dnb.com/token';
    process.env.DNB_TYPEAHEAD_URL = 'https://some.dnb.com/search/typeahead';
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('typeaheadRequest()', () => {
    it('should return companies from D&B', async () => {
      const dnbToken = {
        ...dnbTokenMock,
        createdAt: new Date(),
      };

      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(typeaheadSearchResultMock),
      });

      const searchTerm = 'Example';

      await new DnBClient('SOME_API_KEY', 'SOME_API_SECRET').typeaheadRequest(
        searchTerm,
        JSON.parse(dnbToken.value).access_token
      );

      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DNB_TYPEAHEAD_URL}?searchTerm=${searchTerm}`,
        {
          method: 'GET',
          headers: {
            ['Content-Type']: 'application/json',
            ['Authorization']: `Bearer ${
              JSON.parse(dnbToken.value).access_token
            }`,
          },
        }
      );
    });
  });

  describe('companyByDunsRequest()', () => {
    it('calls D&B to fetch the company data and returns the numberOfEmployees and usdOfRevenue data', async () => {
      const duns = 'DUNS_ID';
      const authToken = 'AUTH_TOKEN';
      const yearlyUsdRevenue = 100000;
      const numberOfEmployees = 20;

      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          organization: {
            financials: [
              {
                informationScopeDescription: FinancialsType.INDIVIDUAL,
                yearlyRevenue: [
                  {
                    currency: 'PLN',
                    value: 200000,
                  },
                  {
                    currency: 'USD',
                    value: 300000,
                  },
                ],
              },
              {
                informationScopeDescription: FinancialsType.ENTIRE_GROUP,
                yearlyRevenue: [
                  {
                    currency: 'PLN',
                    value: 200000,
                  },
                  {
                    currency: 'USD',
                    value: yearlyUsdRevenue,
                  },
                ],
              },
            ],
            numberOfEmployees: [
              {
                informationScopeDescription: NumberOfEmployeesType.INDIVIDUAL,
                value: 12,
              },
              {
                informationScopeDescription: NumberOfEmployeesType.CONSOLIDATED,
                value: numberOfEmployees,
              },
            ],
          },
        }),
      });

      const client = new DnBClient('SOME_API_KEY', 'SOME_API_SECRET');
      const result = await client.companyByDunsRequest(duns, authToken);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${process.env.DNB_BY_DUNS_URL}/${duns}?productId=aassem&versionId=v1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          method: 'GET',
        }
      );
      expect(result).toMatchObject({
        numberOfEmployees,
        usdOfRevenue: yearlyUsdRevenue,
      });
    });
  });
  describe('generateAuthToken()', () => {
    it('generates a new auth token', async () => {
      const accessToken = 'ACCESS_TOKEN';
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          access_token: accessToken,
        }),
      });

      const apiKey = 'SOME_API_KEY';
      const apiSecret = 'SOME_API_SECRET';
      const client = new DnBClient(apiKey, apiSecret);
      const result = await client.generateAuthToken();

      const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString(
        'base64'
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
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
      expect(result).toEqual({
        access_token: accessToken,
      });
    });
  });
});
