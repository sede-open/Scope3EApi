import { IdentifierType } from '../../clients/SAndPClient/types';
import {
  groupCompanyIdentifierData,
  extractCompanyIdentifiersFromAllKnownIdentifiers,
} from './utils';

describe('groupCompanyIdentifierData', () => {
  it('should group record data into categries', () => {
    expect(
      groupCompanyIdentifierData([
        {
          identities: [
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'D&B DUNS',
              identifierValue: '54321',
              primaryFlag: '1',
            },
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'S&P GVKey',
              identifierValue: '210201',
              primaryFlag: '1',
            },
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'SNL Institution ID',
              identifierValue: '4545434',
              primaryFlag: '1',
            },
          ],
          error: null,
          identifier: '54321',
          identifierType: IdentifierType.DUNS,
        },
        {
          identities: null,
          error: 'Data Unavailable',
          identifier: '12345',
          identifierType: IdentifierType.DUNS,
        },
        {
          identities: null,
          error: 'Something else went boom',
          identifier: '12345',
          identifierType: IdentifierType.DUNS,
        },
      ])
    ).toEqual({
      records: [
        {
          identities: [
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'D&B DUNS',
              identifierValue: '54321',
              primaryFlag: '1',
            },
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'S&P GVKey',
              identifierValue: '210201',
              primaryFlag: '1',
            },
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'SNL Institution ID',
              identifierValue: '4545434',
              primaryFlag: '1',
            },
          ],
          error: null,
          identifier: '54321',
          identifierType: IdentifierType.DUNS,
        },
      ],
      dataUnavailable: [
        {
          identities: null,
          error: 'Data Unavailable',
          identifier: '12345',
          identifierType: IdentifierType.DUNS,
        },
      ],
      otherErrors: [
        {
          identities: null,
          error: 'Something else went boom',
          identifier: '12345',
          identifierType: IdentifierType.DUNS,
        },
      ],
    });
  });
});

describe('extractCompanyIdentifiersFromAllKnownIdentifiers', () => {
  it('should convert all identifier format into simple company identifier format where possible', () => {
    expect(
      extractCompanyIdentifiersFromAllKnownIdentifiers([
        /* Record where S&P has D&B */
        {
          identities: [
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'D&B DUNS',
              identifierValue: '54321',
              primaryFlag: '1',
            },
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'S&P GVKey',
              identifierValue: '210201',
              primaryFlag: '1',
            },
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'SNL Institution ID',
              identifierValue: '4545434',
              primaryFlag: '1',
            },
          ],
          error: null,
          identifier: '54321',
          identifierType: IdentifierType.DUNS,
        },
        /* Record where S&P does not have D&B */
        {
          identities: [
            {
              activeFlag: '1',
              companyId: '881594',
              companyName: 'Delta Electronics, Inc.',
              identifierType: 'SNL Institution ID',
              identifierValue: '4545434',
              primaryFlag: '1',
            },
          ],
          error: null,
          identifier: '12345',
          identifierType: IdentifierType.DUNS,
        },
      ])
    ).toEqual([
      {
        ciqId: '881594',
        identities: [
          {
            activeFlag: '1',
            companyId: '881594',
            companyName: 'Delta Electronics, Inc.',
            identifierType: 'D&B DUNS',
            identifierValue: '54321',
            primaryFlag: '1',
          },
          {
            activeFlag: '1',
            companyId: '881594',
            companyName: 'Delta Electronics, Inc.',
            identifierType: 'S&P GVKey',
            identifierValue: '210201',
            primaryFlag: '1',
          },
          {
            activeFlag: '1',
            companyId: '881594',
            companyName: 'Delta Electronics, Inc.',
            identifierType: 'SNL Institution ID',
            identifierValue: '4545434',
            primaryFlag: '1',
          },
        ],
        duns: '54321',
        error: null,
        identifier: '54321',
        identifierType: 'duns',
        name: 'Delta Electronics, Inc.',
      },
      {
        ciqId: '881594',
        identities: [
          {
            activeFlag: '1',
            companyId: '881594',
            companyName: 'Delta Electronics, Inc.',
            identifierType: 'SNL Institution ID',
            identifierValue: '4545434',
            primaryFlag: '1',
          },
        ],
        duns: '12345',
        error: null,
        identifier: '12345',
        identifierType: 'duns',
        name: 'Delta Electronics, Inc.',
      },
    ]);
  });
});
