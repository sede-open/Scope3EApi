import { CompanyStatus } from '../../types';

export interface Company {
  id: string;
  name: string;
  duns: string | null;
  dnbRegion: string | null;
  dnbCountry: string | null;
  dnbCountryIso: string | null;
  dnbPostalCode: string | null;
  dnbAddressLineOne: string | null;
  dnbAddressLineTwo: string | null;
  location: string | null;
  businessSection: string | null;
  subSector: string | null;
  status: CompanyStatus;
  reviewedBy: string | null;
  updatedBy: string | null;
  createdBy: string;
  reviewedAt: Date;
  hubspotId: string;
}

export type CompanyWithDuns = { id: string; name: string; duns: string };
