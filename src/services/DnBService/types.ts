import { CompanyByDunsTransformed } from '../../clients/DnBClient/types';
import { DnBTypeaheadResult } from '../../types';

export interface IDnBService {
  companyByDuns(duns: string): Promise<CompanyByDunsTransformed | null>;
  typeahead(searchTerm: string): Promise<DnBTypeaheadResult[]>;
}
