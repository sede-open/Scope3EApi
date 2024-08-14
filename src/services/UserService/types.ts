import { AuthProvider, ExpertiseDomain, UserStatus } from '../../types';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isDeleted: boolean;
  authProvider: AuthProvider;
  expertiseDomain?: ExpertiseDomain | null;
  companyId: string;
  status: UserStatus;
  hubspotId?: string;
}
