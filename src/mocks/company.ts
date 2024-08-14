import { CompanyEntity } from '../entities/Company';
import { CompanyStatus } from '../types';
type CompanyEntityMock = Omit<
  CompanyEntity,
  | 'createdAt'
  | 'updatedAt'
  | 'remove'
  | 'hasId'
  | 'save'
  | 'softRemove'
  | 'recover'
  | 'reload'
  | 'reviewedAt'
>;

export interface CompanyMock extends CompanyEntityMock {
  createdAt: string;
  updatedAt: string;
  reviewedAt: string;
}
export const companyMock = {
  id: 'D483271B-D5AD-490C-67C4-D5D66B320890',
  name: 'Testing Inc',
  location: 'UK',
  businessSection: 'logistics',
  subSector: 'aviation',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  reviewedAt: '2020-08-27 09:11:00',
  duns: '1111111111',
  dnbRegion: 'Greater London',
  dnbCountry: 'United Kingdom',
  dnbCountryIso: 'UK',
  dnbAddressLineOne: 'Sunny Street',
  dnbAddressLineTwo: 'Sunny Road',
  dnbPostalCode: 'AAAA AAA',
  status: CompanyStatus.Active,
};

export const company2Mock = {
  id: '9083271b-d5ad-490c-67c4-d5d66b320890',
  name: 'Blah Inc',
  location: 'UK',
  businessSection: 'logistics',
  subSector: 'aviation',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  reviewedAt: '2020-08-27 09:11:00',
  duns: '2211111111',
  dnbRegion: 'Greater London',
  dnbCountry: 'United Kingdom',
  dnbCountryIso: 'UK',
  dnbAddressLineOne: 'Cloudy Street',
  dnbAddressLineTwo: 'Cloudy Road',
  dnbPostalCode: 'BBBB BBB',
  status: CompanyStatus.Active,
};

export const company3Mock = {
  id: '63ac35c6-6a25-4867-a936-9873b4100048',
  name: 'Yet Another Inc',
  location: 'DE',
  businessSection: 'IT',
  subSector: 'consulting',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  reviewedAt: '2020-08-27 09:11:00',
  duns: '3311111111',
  dnbRegion: 'Düsseldorf',
  dnbCountry: 'Germany',
  dnbCountryIso: 'DE',
  dnbAddressLineOne: 'Snowy Street',
  dnbAddressLineTwo: 'Snowy Road',
  dnbPostalCode: 'CCCC CCC',
  status: CompanyStatus.Active,
};

export const company4Mock = {
  id: '9BD3C571-CE17-4B03-B6A8-AFAB242C2316',
  name: 'B Corp Company',
  location: 'UK',
  businessSection: 'IT',
  subSector: 'consulting',
  createdAt: '2020-08-27 09:11:00',
  updatedAt: '2020-08-27 09:11:00',
  reviewedAt: undefined,
  updatedBy: 'd483271b-d5ad-490c-b5c4-d5d66b3205bd',
  duns: '3311111112',
  dnbRegion: 'Manchester',
  dnbCountry: 'United Kingdom',
  dnbCountryIso: 'UK',
  dnbAddressLineOne: 'Rainy Street',
  dnbAddressLineTwo: 'Rainy Road',
  dnbPostalCode: 'DDDD DDD',
  status: CompanyStatus.VettingInProgress,
};

export const createCompanyMock = (
  overrides: Partial<CompanyEntity> & { id: string }
) => ({
  name: 'B Corp Company',
  location: 'UK',
  businessSection: 'IT',
  subSector: 'consulting',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  reviewedAt: undefined,
  duns: '3311111112',
  dnbRegion: 'Manchester',
  dnbCountry: 'United Kingdom',
  dnbCountryIso: 'UK',
  dnbAddressLineOne: 'Rainy Street',
  dnbAddressLineTwo: 'Rainy Road',
  dnbPostalCode: 'DDDD DDD',
  status: CompanyStatus.Active,
  ...overrides,
});
