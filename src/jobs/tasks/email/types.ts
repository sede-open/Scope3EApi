import { ISendSingleTransactionalEmailMessageBody } from '../../../clients/HubspotEmailClient/types';

export type EmailJobDataType = {
  recipient: string;
  subject: string;
  body: string;
};

export interface InviteCustomerData {
  inviter_name: string;
  supplier_company_name: string;
  invitation_link: string;
}

export interface InviteSupplierData {
  inviter_name: string;
  customer_company_name: string;
  invitation_link: string;
}

export interface CustomerInvitationApprovedData {
  invitee_name: string;
  customer_company_name: string;
  share_emission_link: string;
}

export interface SupplierInvitationApprovedData {
  invitee_name: string;
  supplier_company_name: string;
  share_emission_link: string;
}

export interface CustomerInvitationDeclinedData {
  invitee_name: string;
  invitee_company_name: string;
  my_network_link: string;
}

export interface SupplierInvitationDeclinedData {
  invitee_name: string;
  invitee_company_name: string;
  my_network_link: string;
}

export interface EmissionAllocationRequestEmailData {
  customer_company_name: string;
  emission_year: string;
  emission_request_link: string;
}

export interface EmissionAllocationSubmittedEmailData {
  supplier_company_name: string;
  emission_year: string;
  emission_request_link: string;
}

export interface EmissionAllocationAcceptedEmailData {
  customer_company_name: string;
  emission_year: string;
  value_chain_link: string;
}

export type EmissionAllocationRejectedEmailData = EmissionAllocationAcceptedEmailData;

export interface EmissionAllocationUpdatedEmailData {
  supplier_company_name: string;
  emission_year: string;
  value_chain_link: string;
}

export interface EmissionAllocationDeletedEmailData {
  supplier_company_name: string;
  emission_year: string;
  emission_amount: string;
  dashboard_link: string;
}

export interface UnableToInviteCompanyEmailData {
  invitee_name: string;
  invitee_company_name: string;
  my_network_link: string;
}

export type RegistrationUnsuccessfulEmailData = Record<string, never>;

export interface JoiningInvitationDeclinedData {
  invitee_name: string;
  invitee_company_name: string;
  decline_reason: string;
  my_network_link: string;
}

export interface DataPrivacyRequestData {
  user_name: string;
  company_name: string;
}

export type CustomPropertiesTypes =
  | InviteCustomerData
  | InviteSupplierData
  | CustomerInvitationApprovedData
  | SupplierInvitationApprovedData
  | CustomerInvitationDeclinedData
  | SupplierInvitationDeclinedData
  | EmissionAllocationRequestEmailData
  | EmissionAllocationSubmittedEmailData
  | EmissionAllocationSubmittedEmailData
  | EmissionAllocationRejectedEmailData
  | EmissionAllocationUpdatedEmailData
  | EmissionAllocationDeletedEmailData
  | UnableToInviteCompanyEmailData
  | RegistrationUnsuccessfulEmailData
  | EmissionAllocationAcceptedEmailData
  | JoiningInvitationDeclinedData
  | DataPrivacyRequestData;

export interface HubspotTransactionalJobData<
  CustomProperties = CustomPropertiesTypes,
  ContactProperties = {
    firstname: string;
    lastname: string;
  }
> {
  emailId: number;
  messageBody: Partial<ISendSingleTransactionalEmailMessageBody> & {
    to: string;
  };
  customProperties: CustomProperties;
  contactProperties: ContactProperties;
}
