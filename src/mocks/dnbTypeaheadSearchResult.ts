export const typeaheadSearchResultMock = {
  transactionDetail: {
    transactionID: 'rrt-0daa1ee1e57942d41-b-eu-16317-88058696-15',
    transactionTimestamp: '2021-04-22T13:09:34.634Z',
    inLanguage: 'en-US',
    serviceVersion: '1',
  },
  inquiryDetail: {
    searchTerm: 'example',
  },
  candidatesReturnedQuantity: 10,
  candidatesMatchedQuantity: 93807,
  searchCandidates: [
    {
      displaySequence: 1,
      organization: {
        duns: '407888804',
        dunsControlStatus: {
          isOutOfBusiness: false,
        },
        primaryName: 'COMPANY plc',
        primaryAddress: {
          addressCountry: {
            isoAlpha2Code: 'NL',
          },
          streetAddress: {
            line1: 'Carel van Bylandtlaan 30',
          },
          addressLocality: {
            name: "'s-Gravenhage",
          },
          addressRegion: {
            name: 'ZUID-HOLLAND',
          },
          postalCode: '2596 HR',
        },
        corporateLinkage: {
          isBranch: false,
          globalUltimate: {
            duns: '423792808',
            primaryName: 'COMPANY PLC',
          },
        },
        financials: [
          {
            yearlyRevenue: [
              {
                value: 4.21105e11,
                currency: 'USD',
              },
            ],
          },
        ],
        primaryIndustryCodes: [
          {
            usSicV4: '6733',
            usSicV4Description: 'Trust management',
          },
        ],
      },
    },
    {
      displaySequence: 2,
      organization: {
        duns: '423792808',
        dunsControlStatus: {
          isOutOfBusiness: false,
        },
        primaryName: 'COMPANY PLC',
        primaryAddress: {
          addressCountry: {
            isoAlpha2Code: 'GB',
          },
          streetAddress: {
            line1: 'Example Centre',
          },
          addressLocality: {
            name: 'LONDON',
          },
          postalCode: 'SE1 7NA',
        },
        corporateLinkage: {
          isBranch: false,
          globalUltimate: {
            duns: '423792808',
            primaryName: 'COMPANY PLC',
          },
        },
        financials: [
          {
            yearlyRevenue: [
              {
                value: 3.44877e11,
                currency: 'USD',
              },
            ],
          },
        ],
        tradeStyleNames: [
          {
            name: 'Example',
            priority: 1,
          },
        ],
        primaryIndustryCodes: [
          {
            usSicV4: '6719',
            usSicV4Description: 'Holding company',
          },
        ],
      },
    },
  ],
};
