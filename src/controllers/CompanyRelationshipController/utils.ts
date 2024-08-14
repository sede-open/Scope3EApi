import { IContext } from '../../apolloContext';
import { getConectionApprovedTemplate } from '../../emailTemplates/connectionApproved';
import { getConectionRejectedTemplate } from '../../emailTemplates/connectionRejected';
import { getNewConnectionRequestTemplate } from '../../emailTemplates/newConnectionRequest';
import { UserEntity } from '../../entities/User';
import { Company, CompanyRelationshipType, InviteStatus } from '../../types';

const VALIID_INVITE_STATUSES = {
  [CompanyRelationshipType.Customer]: {
    [InviteStatus.Approved]: [],
    [InviteStatus.AwaitingSupplierApproval]: [],
    [InviteStatus.AwaitingCustomerApproval]: [
      InviteStatus.Approved,
      InviteStatus.RejectedByCustomer,
    ],
    [InviteStatus.RejectedBySupplier]: [InviteStatus.AwaitingSupplierApproval],
    [InviteStatus.RejectedByCustomer]: [InviteStatus.Approved],
  },
  [CompanyRelationshipType.Supplier]: {
    [InviteStatus.Approved]: [],
    [InviteStatus.AwaitingCustomerApproval]: [],
    [InviteStatus.AwaitingSupplierApproval]: [
      InviteStatus.Approved,
      InviteStatus.RejectedBySupplier,
    ],
    [InviteStatus.RejectedBySupplier]: [InviteStatus.Approved],
    [InviteStatus.RejectedByCustomer]: [InviteStatus.AwaitingCustomerApproval],
  },
};

export const isValidInviteStatusChange = (
  currentInviteStatus: InviteStatus,
  nextInviteStatus: InviteStatus,
  approverType: CompanyRelationshipType
) => {
  return !!VALIID_INVITE_STATUSES[approverType][currentInviteStatus].find(
    (e) => e === nextInviteStatus
  );
};

const isConnectionRejected = (
  previousStatus: InviteStatus,
  updatedStatus: InviteStatus
) => {
  return (
    (previousStatus === InviteStatus.AwaitingCustomerApproval &&
      updatedStatus === InviteStatus.RejectedByCustomer) ||
    (previousStatus === InviteStatus.AwaitingSupplierApproval &&
      updatedStatus === InviteStatus.RejectedBySupplier)
  );
};

const isConnectionApproved = (
  previousStatus: InviteStatus,
  updatedStatus: InviteStatus
) => {
  return (
    (previousStatus === InviteStatus.AwaitingCustomerApproval ||
      previousStatus === InviteStatus.AwaitingSupplierApproval) &&
    updatedStatus === InviteStatus.Approved
  );
};

const isNewConnection = (
  previousStatus: InviteStatus,
  updatedStatus: InviteStatus
) => {
  return (
    (previousStatus === InviteStatus.RejectedByCustomer &&
      updatedStatus === InviteStatus.AwaitingCustomerApproval) ||
    (previousStatus === InviteStatus.RejectedBySupplier &&
      updatedStatus === InviteStatus.AwaitingSupplierApproval)
  );
};

export const getInviteStatusChangeEmailInfo = ({
  previousInviteStatus,
  updatedInviteStatus,
  senderCompany,
  inviteType,
}: {
  senderCompany: Company;
  previousInviteStatus: InviteStatus;
  updatedInviteStatus: InviteStatus;
  inviteType: CompanyRelationshipType;
}) => {
  if (isConnectionRejected(previousInviteStatus, updatedInviteStatus)) {
    return getConectionRejectedTemplate({
      connectionName: senderCompany.name,
      ctaLink: `${process.env.WEB_APP_BASE_URL}/account-settings`,
      connectionType:
        inviteType === CompanyRelationshipType.Supplier
          ? 'supplier'
          : 'customer',
    });
  } else if (isConnectionApproved(previousInviteStatus, updatedInviteStatus)) {
    return getConectionApprovedTemplate({
      connectionName: senderCompany.name,
      ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain`,
      connectionType:
        inviteType === CompanyRelationshipType.Supplier
          ? 'supplier'
          : 'customer',
    });
  } else if (isNewConnection(previousInviteStatus, updatedInviteStatus)) {
    return getNewConnectionRequestTemplate({
      connectionName: senderCompany.name,
      ctaLink: `${process.env.WEB_APP_BASE_URL}/account-settings`,
      connectionType:
        inviteType === CompanyRelationshipType.Supplier
          ? 'supplier'
          : 'customer',
    });
  }

  return {
    template: '',
    subject: '',
  };
};

export const sendInviteStatusChangeEmail = (
  {
    previousInviteStatus,
    updatedInviteStatus,
    senderCompany,
    recipient,
    inviteType,
  }: {
    senderCompany: Company;
    recipient: UserEntity;
    previousInviteStatus: InviteStatus;
    updatedInviteStatus: InviteStatus;
    inviteType: CompanyRelationshipType;
  },
  context: IContext
) => {
  if (isConnectionRejected(previousInviteStatus, updatedInviteStatus)) {
    if (inviteType === CompanyRelationshipType.Supplier) {
      return context.clients.hubspotEmail.sendSupplierInvitationDeclinedEmail({
        recipient,
        inviteeName: `${context.user.firstName} ${context.user.lastName}`,
        inviteeCompanyName: senderCompany.name,
      });
    } else {
      return context.clients.hubspotEmail.sendCustomerInvitationDeclinedEmail({
        recipient,
        inviteeName: `${context.user.firstName} ${context.user.lastName}`,
        inviteeCompanyName: senderCompany.name,
      });
    }
  } else if (isConnectionApproved(previousInviteStatus, updatedInviteStatus)) {
    if (inviteType === CompanyRelationshipType.Supplier) {
      return context.clients.hubspotEmail.sendSupplierInvitationApprovedEmail({
        recipient,
        inviteeName: `${context.user.firstName} ${context.user.lastName}`,
        supplierCompanyName: senderCompany.name,
      });
    } else {
      return context.clients.hubspotEmail.sendCustomerInvitationApprovedEmail({
        recipient,
        inviteeName: `${context.user.firstName} ${context.user.lastName}`,
        customerCompanyName: senderCompany.name,
      });
    }
  } else if (isNewConnection(previousInviteStatus, updatedInviteStatus)) {
    if (inviteType === CompanyRelationshipType.Supplier) {
      return context.clients.hubspotEmail.sendInviteSupplierEmail({
        recipient,
        inviterName: `${context.user.firstName} ${context.user.lastName}`,
        customerCompanyName: senderCompany.name,
      });
    } else {
      return context.clients.hubspotEmail.sendInviteCustomerEmail({
        recipient,
        inviterName: `${context.user.firstName} ${context.user.lastName}`,
        supplierCompanyName: senderCompany.name,
      });
    }
  }
};
