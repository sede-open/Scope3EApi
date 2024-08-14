import { EmissionMissingIntensity } from '../../repositories/CorporateEmissionRepository/types';
import { CorporateEmissionType, Scope2Type } from '../../types';

export interface ICorporateEmission {
  id: string;
  type: CorporateEmissionType;
  companyId: string;
  year: number;
  scope1: number;
  scope2: number;
  scope3?: number | null;
  scope2Type: Scope2Type;
  offset?: number | null;
  examplePercentage?: number | null;
  headCount?: number | null;
  createdBy: string;
  verificationFileId?: string | null;
  updatedBy?: string;
}

export interface ICorporateEmissionService {
  findEmissionsMissingEstimatedUsdOfRevenue(): Promise<
    EmissionMissingIntensity[]
  >;
  findEmissionsMissingEstimatedNumberOfEmployees(): Promise<
    EmissionMissingIntensity[]
  >;
}
