import { RoleName } from '../types';

export const isExternalUser = (userRole?: RoleName) => {
  if (!userRole) {
    return false;
  }

  return (
    [RoleName.SupplierEditor, RoleName.SupplierViewer].indexOf(userRole) !== -1
  );
};

export const isPartOfSameCompany = ({
  companyId,
  userCompanyId,
}: {
  companyId?: string;
  userCompanyId?: string;
}) => {
  if (!companyId || !userCompanyId) {
    return false;
  }

  return userCompanyId === companyId;
};
