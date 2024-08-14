import { CompanyPrivacy } from '../repositories/CompanyPrivacyRepository/types';
import { CompanyPrivacyInput } from '../types';

export const getCompanyPrivacyInput = (
  companyPrivacyInput?: Partial<CompanyPrivacyInput>
): CompanyPrivacyInput => ({
  allPlatform: false,
  customerNetwork: false,
  supplierNetwork: false,
  ...companyPrivacyInput,
});

export const getCompanyPrivacy = (
  companyPrivacy?: Partial<CompanyPrivacy>
): CompanyPrivacy => ({
  companyId: '948fa748-609d-4088-bb49-f390919141b2',
  allPlatform: true,
  customerNetwork: false,
  supplierNetwork: false,
  ...companyPrivacy,
});
