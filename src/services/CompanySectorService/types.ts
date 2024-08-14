import { Company } from '../../repositories/CompanyRepository/types';
import { User } from '../../types';

interface Sector {
  id: string;
  name: string;
  industryCode: string;
  industryType: string;
  sourceName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICompanySector {
  id: string;
  companyId: string;
  sectorId: string;
  sectorType: string;
  company?: Company;
  sector?: Sector;
  createdBy?: string;
  createdByUser?: User;
  updatedBy?: string;
  updatedByUser?: User;
  createdAt: string;
  updatedAt: string;
}
