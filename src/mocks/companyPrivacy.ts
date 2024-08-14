import { CompanyPrivacyEntity } from '../entities/CompanyPrivacy';

export const createCompanyPrivacyMock = (
  mockParams: Partial<CompanyPrivacyEntity> & { companyId: string }
): Partial<CompanyPrivacyEntity> => {
  return {
    allPlatform: false,
    customerNetwork: false,
    supplierNetwork: false,
    ...mockParams,
  };
};
