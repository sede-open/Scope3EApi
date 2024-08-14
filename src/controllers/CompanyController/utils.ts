import { CompanyStatus } from '../../types';

export const VALID_COMPANY_STATUSES: {
  [status in CompanyStatus]: CompanyStatus[];
} = {
  [CompanyStatus.Active]: [],
  [CompanyStatus.InvitationDeclined]: [CompanyStatus.PendingUserConfirmation],
  [CompanyStatus.PendingUserActivation]: [CompanyStatus.Active],
  [CompanyStatus.PendingUserConfirmation]: [
    CompanyStatus.VettingInProgress,
    CompanyStatus.InvitationDeclined,
  ],
  [CompanyStatus.Vetoed]: [],
  [CompanyStatus.VettingInProgress]: [
    CompanyStatus.PendingUserActivation,
    CompanyStatus.Vetoed,
  ],
};

export const isCompanyStatusChangeValid = ({
  currentStatus,
  nextStatus,
}: {
  currentStatus: CompanyStatus;
  nextStatus: CompanyStatus;
}) => {
  return VALID_COMPANY_STATUSES[currentStatus].indexOf(nextStatus) !== -1;
};
