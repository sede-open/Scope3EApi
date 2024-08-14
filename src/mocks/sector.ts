import { Sector } from '../types';

export const sectorMock = {
  id: '792F1707-D95C-4801-961E-0EC781AE274F',
  name: 'Electrical work',
  industryCode: '173',
  industryType: 'US Standard Industry Code 1987 - 3 digit',
  sourceName: 'DNB',
  createdAt: '2021-08-19 14:20:25.623',
  updatedAt: '2021-08-19 14:20:25.623',
  division: 'CONSTRUCTION',
};

export const sector2Mock = {
  id: '92C7E206-3BED-4F86-AD28-2AF7874F0C90',
  name: 'Automotive rental and leasing, without drivers',
  industryCode: '751',
  industryType: 'US Standard Industry Code 1987 - 3 digit',
  sourceName: 'DNB',
  createdAt: '2021-08-19 14:20:26.107',
  updatedAt: '2021-08-19 14:20:26.107',
  division: 'SERVICES',
};

export const sector3Mock = {
  id: 'B2F5F9E1-1E9C-4F5C-8F9C-2B5F8B9F0C90',
  name: 'Fish Hatcheries and Preserves',
  industryCode: '1121',
  industryType: 'US Standard Industry Code 1987 - 4 digit',
  sourceName: 'DNB',
  createdAt: '2021-08-19 14:20:26.107',
  updatedAt: '2021-08-19 14:20:26.107',
  division: 'FINANCE_INSURANCE_REAL_ESTATE',
};

export const sameDivisionAsSectorMock = {
  id: 'B2F5F9E1-1E9C-4F5C-8F9C-2B5F8B9F0C91',
  name: 'General building contractors-residential contractors',
  industryCode: '1521',
  industryType: 'US Standard Industry Code 1987 - 4 digit',
  sourceName: 'DNB',
  createdAt: '2021-08-19 14:20:26.107',
  updatedAt: '2021-08-19 14:20:26.107',
  division: 'CONSTRUCTION',
};

export const sameDivisionAsSector2Mock = {
  id: 'B2F5F9E1-1E9C-4F5C-8F9C-2B5F8B9F0C92',
  name: 'Insurance Carriers',
  industryCode: '5241',
  industryType: 'US Standard Industry Code 1987 - 4 digit',
  sourceName: 'DNB',
  createdAt: '2021-08-19 14:20:26.107',
  updatedAt: '2021-08-19 14:20:26.107',
  division: 'SERVICES',
};

export const createSectorMock = (
  overrides: Partial<Sector> & { id: string }
): Sector => ({
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Electrical work',
  industryCode: '173',
  industryType: 'US Standard Industry Code 1987 - 3 digit',
  sourceName: 'DNB',
  division: 'CONSTRUCTION',
  ...overrides,
});
