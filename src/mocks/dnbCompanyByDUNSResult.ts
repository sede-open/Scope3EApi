export const getDnBCompanyByDunsResult = (duns = '804735132') => ({
  transactionDetail: {
    transactionID: 'rrt-08b0193e94a8791eb-b-eu-17685-9364416-9_3249',
    transactionTimestamp: '2021-08-19T12:52:19.986Z',
    inLanguage: 'en-US',
    productID: 'aassem',
    productVersion: '1',
  },
  inquiryDetail: {
    productVersion: 'v1',
    productID: 'aassem',
    duns,
  },
  organization: {
    duns,
    dunsControlStatus: {
      operatingStatus: {
        description: 'Active',
        dnbCode: 9074,
      },
      isMarketable: false,
      isMailUndeliverable: false,
      isTelephoneDisconnected: false,
      isDelisted: true,
      subjectHandlingDetails: [
        {
          description: 'Do not fax',
          dnbCode: 7972,
        },
        {
          description: 'Do not call',
          dnbCode: 7974,
        },
        {
          description: 'Do not mail',
          dnbCode: 7975,
        },
        {
          description: 'Do not e-mail',
          dnbCode: 9051,
        },
        {
          description: 'Suppress from all marketing lists',
          dnbCode: 9146,
        },
      ],
      fullReportDate: '2021-07-28',
    },
    primaryName: 'Gorman Manufacturing Company, Inc.',
    primaryAddress: {
      language: {},
      addressCountry: {
        name: 'United States',
        isoAlpha2Code: 'US',
      },
      continentalRegion: {
        name: 'North America',
      },
      addressLocality: {
        name: 'San Francisco',
      },
      minorTownName: null,
      addressRegion: {
        name: 'California',
        abbreviatedName: 'CA',
      },
      addressCounty: {
        name: 'San Francisco',
      },
      postalCode: '94110',
      postalCodePosition: {},
      streetNumber: null,
      streetName: null,
      streetAddress: {
        line1: '492 Koller St',
        line2: null,
      },
      postOfficeBox: {},
      latitude: 37.777709,
      longitude: -122.404624,
      geographicalPrecision: {
        description: 'Street Segment Centroid',
        dnbCode: 30256,
      },
      isRegisteredAddress: false,
      locationOwnership: {},
      congressionalDistricts: [],
      isResidentialAddress: null,
    },
    numberOfEmployees: [
      {
        value: 120,
        informationScopeDescription: 'Headquarters Only (Employs Here)',
        informationScopeDnBCode: 9068,
        reliabilityDescription: 'Actual',
        reliabilityDnBCode: 9092,
        employeeCategories: [],
      },
      {
        value: 153,
        informationScopeDescription: 'Consolidated',
        informationScopeDnBCode: 9067,
        reliabilityDescription: 'Actual',
        reliabilityDnBCode: 9092,
        employeeCategories: [
          {
            employmentBasisDescription: 'Principals',
            employmentBasisDnBCode: 9064,
          },
        ],
      },
    ],
    financials: [
      {
        financialStatementToDate: '2020-12-31',
        financialStatementDuration: null,
        informationScopeDescription: 'Consolidated',
        informationScopeDnBCode: 9067,
        reliabilityDescription: 'Actual',
        reliabilityDnBCode: 9092,
        unitCode: 'SingleUnits',
        yearlyRevenue: [
          {
            value: 2.059987e7,
            currency: 'USD',
          },
        ],
      },
    ],
    dnbAssessment: {
      assignmentModel: {
        isStandalone: false,
        familytreeRolesPlayed: [
          {
            description: 'Parent',
            dnbCode: 12773,
          },
        ],
        employeeReliability: {
          description: 'Assigned',
          dnbCode: 33392,
        },
        salesReliability: {
          description: 'Assigned',
          dnbCode: 33392,
        },
        hasChangeInGlobalUltimate: false,
        physicalLocation: {
          employeeCount: 108,
          salesAmount: 1.0,
        },
        linkedCompanies: {
          employeeCount: 153,
          salesAmount: 5.7797054e7,
        },
        countryGroup: {
          employeeCount: 108,
          salesAmount: 1.0,
        },
        globalUltimate: {
          duns: '804735132',
          employeeCount: 153,
          salesAmount: 5.7797054e7,
          familyTreeMembersCount: 2,
          industrySectorsCount: 2,
          primarySector: {
            industryCode: '232',
            industryDescription:
              "Men's and boy's furnishings and work clothing",
            typeDnBCode: 23406,
            typeDescription: 'US Standard Industry Code 1987 - 3 digit',
            sectorPercentage: 59.84,
          },
          secondarySector: {
            industryCode: '275',
            industryDescription: 'Commercial printing',
            typeDnBCode: 23406,
            typeDescription: 'US Standard Industry Code 1987 - 3 digit',
            sectorPercentage: 40.16,
          },
          unclassifiedSector: {},
        },
        domesticUltimate: {
          duns: '804735132',
          employeeCount: 108,
          salesAmount: 1.0,
          familyTreeMembersCount: 1,
          industrySectorsCount: 1,
          primarySector: {
            industryCode: '275',
            industryDescription: 'Commercial printing',
            typeDnBCode: 23406,
            typeDescription: 'US Standard Industry Code 1987 - 3 digit',
            sectorPercentage: 100.0,
          },
          secondarySector: {
            industryCode: ' ',
            industryDescription: null,
            typeDnBCode: 23406,
            typeDescription: 'US Standard Industry Code 1987 - 3 digit',
            sectorPercentage: null,
          },
          unclassifiedSector: {},
        },
      },
    },
  },
});
