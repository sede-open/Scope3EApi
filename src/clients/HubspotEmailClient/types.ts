import { Job } from 'bull';
import { Response as FetchResponse } from 'node-fetch';
import {
  CustomerInvitationApprovedData,
  CustomerInvitationDeclinedData,
  CustomPropertiesTypes,
  EmissionAllocationAcceptedEmailData,
  EmissionAllocationDeletedEmailData,
  EmissionAllocationRejectedEmailData,
  EmissionAllocationRequestEmailData,
  EmissionAllocationSubmittedEmailData,
  EmissionAllocationUpdatedEmailData,
  InviteCustomerData,
  InviteSupplierData,
  JoiningInvitationDeclinedData,
  RegistrationUnsuccessfulEmailData,
  SupplierInvitationApprovedData,
  SupplierInvitationDeclinedData,
  UnableToInviteCompanyEmailData,
} from '../../jobs/tasks/email/types';
import {
  ContactProperties,
  ISendTransactionalEmailResponse,
} from '../HubspotClient/types';

interface Response<T> extends FetchResponse {
  json(): Promise<T>;
}

export interface ISendSingleTransactionalEmailMessageBody {
  from: string;
  to: string;
  sendId: string;
  replyTo: string[];
  cc: string[];
  bcc: string[];
}

export interface IHubspotEmailClient {
  sendTransactionalEmail(
    emailId: number,
    messageBody: Partial<ISendSingleTransactionalEmailMessageBody>,
    contactProperties?: Partial<ContactProperties>,
    customProperties?: CustomPropertiesTypes
  ): Promise<Response<ISendTransactionalEmailResponse> | undefined>;
  sendInviteCustomerEmail(
    args: InviteCustomerArgs
  ): Promise<Job<InviteCustomerData>>;
  sendInviteSupplierEmail(
    args: InviteSupplierArgs
  ): Promise<Job<InviteSupplierData>>;
  sendCustomerInvitationApprovedEmail(
    args: CustomerInvitationApprovedArgs
  ): Promise<Job<CustomerInvitationApprovedData>>;
  sendSupplierInvitationApprovedEmail(
    args: SupplierInvitationApprovedArgs
  ): Promise<Job<SupplierInvitationApprovedData>>;
  sendCustomerInvitationDeclinedEmail(
    args: CustomerInvitationDeclinedArgs
  ): Promise<Job<CustomerInvitationDeclinedData>>;
  sendSupplierInvitationDeclinedEmail(
    args: SupplierInvitationDeclinedArgs
  ): Promise<Job<SupplierInvitationDeclinedData>>;
  sendEmissionAllocationRequestEmail(
    args: EmissionAllocationRequestEmailArgs
  ): Promise<Job<EmissionAllocationRequestEmailData>>;
  sendEmissionAllocationSubmittedEmail(
    args: EmissionAllocationSubmittedEmailArgs
  ): Promise<Job<EmissionAllocationSubmittedEmailData>>;
  sendEmissionAllocationAcceptedEmail(
    args: EmissionAllocationAcceptedEmailArgs
  ): Promise<Job<EmissionAllocationAcceptedEmailData>>;
  sendEmissionAllocationRejectedEmail(
    args: EmissionAllocationRejectedEmailArgs
  ): Promise<Job<EmissionAllocationRejectedEmailData>>;
  sendEmissionAllocationUpdatedEmail(
    args: EmissionAllocationUpdatedEmailArgs
  ): Promise<Job<EmissionAllocationUpdatedEmailData>>;
  sendEmissionAllocationDeletedEmail(
    args: EmissionAllocationDeletedEmailArgs
  ): Promise<Job<EmissionAllocationDeletedEmailData>>;
  sendUnableToInviteCompanyEmail(
    args: UnableToInviteCompanyEmailArgs
  ): Promise<Job<UnableToInviteCompanyEmailData>>;
  sendRegistrationUnsuccessfulEmail(
    args: RegistrationUnsuccessfulEmailArgs
  ): Promise<Job<RegistrationUnsuccessfulEmailData>>;
  sendJoiningInvitationDeclined(
    args: JoiningInvitationDeclinedArgs
  ): Promise<Job<JoiningInvitationDeclinedData>>;
}

export interface RecipientBase {
  email: string;
  firstName: string;
  lastName: string;
}

export interface InviteCustomerArgs<T = RecipientBase> {
  recipient: T;
  inviterName: string;
  supplierCompanyName: string;
}

export interface InviteSupplierArgs<T = RecipientBase> {
  recipient: T;
  inviterName: string;
  customerCompanyName: string;
}

export interface CustomerInvitationApprovedArgs<T = RecipientBase> {
  recipient: T;
  inviteeName: string;
  customerCompanyName: string;
}

export interface SupplierInvitationApprovedArgs<T = RecipientBase> {
  recipient: T;
  inviteeName: string;
  supplierCompanyName: string;
}

export interface CustomerInvitationDeclinedArgs<T = RecipientBase> {
  recipient: T;
  inviteeName: string;
  inviteeCompanyName: string;
}

export interface SupplierInvitationDeclinedArgs<T = RecipientBase> {
  recipient: T;
  inviteeName: string;
  inviteeCompanyName: string;
}

export interface EmissionAllocationRequestEmailArgs<T = RecipientBase> {
  recipient: T;
  customerCompanyName: string;
  emissionYear: string;
}

export interface EmissionAllocationSubmittedEmailArgs<T = RecipientBase> {
  recipient: T;
  supplierCompanyName: string;
  emissionYear: string;
}

export type EmissionAllocationAcceptedEmailArgs<
  T = RecipientBase
> = EmissionAllocationRequestEmailArgs<T>;
export type EmissionAllocationRejectedEmailArgs<
  T = RecipientBase
> = EmissionAllocationAcceptedEmailArgs<T>;
export type EmissionAllocationUpdatedEmailArgs<
  T = RecipientBase
> = EmissionAllocationSubmittedEmailArgs<T>;

export interface EmissionAllocationDeletedEmailArgs<T = RecipientBase> {
  recipient: T;
  supplierCompanyName: string;
  emissionYear: string;
  emissionAmount: string;
}

export interface UnableToInviteCompanyEmailArgs<T = RecipientBase> {
  recipient: T;
  inviteeName: string;
  inviteeCompanyName: string;
}

export interface RegistrationUnsuccessfulEmailArgs<T = RecipientBase> {
  recipient: T;
}

export interface JoiningInvitationDeclinedArgs<T = RecipientBase> {
  recipient: T;
  inviteeName: string;
  inviteeCompanyName: string;
  declineReason: string;
}

export interface ResendInviteToJoinArgs<T = RecipientBase> {
  recipient: T;
  inviterName: string;
  inviterCompanyName: string;
  invitationLink: string;
}

export interface DataShareRequestEmailArgs<T = RecipientBase> {
  recipient: T;
  requesterName: string;
  requesterCompanyName: string;
}
