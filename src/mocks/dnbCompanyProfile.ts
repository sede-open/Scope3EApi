import { DnBCompanyProfileType } from '../clients/DnBClient/types';

export const getDnBCompanyProfile = (
  overrides: Partial<DnBCompanyProfileType> = {}
) => ({
  duns: '804735132',
  name: 'Gorman Manufacturing Company, Inc.',
  countryName: 'United States',
  countryIso: 'US',
  region: 'California',
  postalCode: 'CCC CCCC',
  addressLineOne: 'Sunny Cali St',
  addressLineTwo: 'Sunny Cali Rd',
  primarySector: {
    industryCode: '275',
    industryDescription: 'Commercial printing',
    typeDescription: 'US Standard Industry Code 1987 - 3 digit',
  },
  secondarySector: {
    industryCode: '569',
    industryDescription: 'Miscellaneous apparel and accessories',
    typeDescription: 'US Standard Industry Code 1987 - 3 digit',
  },
  ...overrides,
});
