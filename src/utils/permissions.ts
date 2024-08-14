import { CompanyEntity } from '../entities/Company';
import { UserEntity, UserEntityWithRoles } from '../entities/User';
import { CompanyStatus, RoleName } from '../types';

export const hasExternalRole = (user: UserEntityWithRoles) =>
  user.roles.map((role) => role.name).includes(RoleName.SupplierEditor) ||
  user.roles.map((role) => role.name).includes(RoleName.SupplierViewer);

export const belongsToApprovedCompany = (user: Pick<UserEntity, 'company'>) =>
  user.company?.status === CompanyStatus.Active ||
  user.company?.status === CompanyStatus.PendingUserActivation;

export const isApprovedCompany = (company: Pick<CompanyEntity, 'status'>) =>
  company.status === CompanyStatus.Active ||
  company.status === CompanyStatus.PendingUserActivation;
