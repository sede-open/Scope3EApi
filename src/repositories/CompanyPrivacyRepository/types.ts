export type CompanyPrivacyCount = { companyId: string; count: number };

export interface CompanyPrivacy {
  id?: string;
  companyId: string;
  allPlatform: boolean;
  customerNetwork: boolean;
  supplierNetwork: boolean;
}
