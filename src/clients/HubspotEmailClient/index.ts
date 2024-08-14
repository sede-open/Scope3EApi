import { HubspotClient } from '../HubspotClient';
import { Environment, Flags, getConfig } from '../../config';
import {
  HUBSPOT_EMAIL_ID,
  TEST_HUBSPOT_EMAIL_ID,
  WHITELISTED_EMAILS,
} from '../../constants/hubspot';
import { addJobSendHubspotEmailToQueue } from '../../jobs/tasks/email/queue';
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
import { logger } from '../../utils/logger';
import { HubspotEmails } from './constants';
import {
  CustomerInvitationApprovedArgs,
  CustomerInvitationDeclinedArgs,
  DataShareRequestEmailArgs,
  EmissionAllocationAcceptedEmailArgs,
  EmissionAllocationDeletedEmailArgs,
  EmissionAllocationRequestEmailArgs,
  EmissionAllocationSubmittedEmailArgs,
  EmissionAllocationUpdatedEmailArgs,
  IHubspotEmailClient,
  InviteCustomerArgs,
  InviteSupplierArgs,
  ISendSingleTransactionalEmailMessageBody,
  JoiningInvitationDeclinedArgs,
  RecipientBase,
  RegistrationUnsuccessfulEmailArgs,
  ResendInviteToJoinArgs,
  SupplierInvitationApprovedArgs,
  SupplierInvitationDeclinedArgs,
  UnableToInviteCompanyEmailArgs,
} from './types';
import { ContactBody } from '../HubspotClient/types';

export class HubspotEmailClient implements IHubspotEmailClient {
  private webAppBaseUrl: string;

  constructor(private readonly hubspotClient: HubspotClient) {
    const { webAppBaseUrl } = getConfig();

    this.webAppBaseUrl = webAppBaseUrl;
  }

  private shouldSendTransactionalEmail(recipientEmail: string) {
    const { flags, environment } = getConfig();
    const isHubspotEnabled =
      flags[Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED] ||
      flags[Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED] ||
      flags[Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED] ||
      flags[Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED];

    const isTheRecipientWhitelisted =
      environment === Environment.PROD ||
      WHITELISTED_EMAILS.includes(recipientEmail.toLocaleLowerCase());

    return isHubspotEnabled && isTheRecipientWhitelisted;
  }

  /**
   * The transactional email feature is not available on demo accounts
   * because of this there is no development environment.
   *
   * If you wish to test this, you will need to use a production API Key.
   * However, it is very important you do not then use this function
   * with production data.
   */
  public async sendTransactionalEmail(
    emailId: number,
    messageBody: Partial<ISendSingleTransactionalEmailMessageBody> & {
      to: string;
    },
    contactProperties: Partial<ContactBody['properties']> = {},
    customProperties: CustomPropertiesTypes = {}
  ) {
    if (!this.shouldSendTransactionalEmail(messageBody.to)) {
      logger.info(`Not sending the email to HubSpot: ${emailId}`);
      return;
    }

    return this.hubspotClient.sendTransactionalEmailRequest(
      emailId,
      messageBody,
      contactProperties,
      customProperties
    );
  }

  private getTransactionalEmailId = (key: keyof typeof HUBSPOT_EMAIL_ID) => {
    const { environment } = getConfig();
    return environment === Environment.PROD
      ? HUBSPOT_EMAIL_ID[key]
      : TEST_HUBSPOT_EMAIL_ID[key];
  };

  public sendInviteCustomerEmail = <T extends RecipientBase>({
    recipient,
    inviterName,
    supplierCompanyName,
  }: InviteCustomerArgs<T>) => {
    return addJobSendHubspotEmailToQueue<InviteCustomerData>({
      emailId: this.getTransactionalEmailId(HubspotEmails.INVITE_CUSTOMER),
      messageBody: { to: recipient.email },
      customProperties: {
        inviter_name: inviterName,
        supplier_company_name: supplierCompanyName,
        invitation_link: `${this.webAppBaseUrl}/account-settings/suppliers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendInviteSupplierEmail = <T extends RecipientBase>({
    recipient,
    inviterName,
    customerCompanyName,
  }: InviteSupplierArgs<T>) => {
    return addJobSendHubspotEmailToQueue<InviteSupplierData>({
      emailId: this.getTransactionalEmailId(HubspotEmails.INVITE_SUPPLIER),
      messageBody: { to: recipient.email },
      customProperties: {
        inviter_name: inviterName,
        customer_company_name: customerCompanyName,
        invitation_link: `${this.webAppBaseUrl}/account-settings/customers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendCustomerInvitationApprovedEmail = <T extends RecipientBase>({
    recipient,
    inviteeName,
    customerCompanyName,
  }: CustomerInvitationApprovedArgs<T>) => {
    return addJobSendHubspotEmailToQueue<CustomerInvitationApprovedData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.CUSTOMER_INVITATION_APPROVED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        invitee_name: inviteeName,
        customer_company_name: customerCompanyName,
        share_emission_link: `${this.webAppBaseUrl}/value-chain/customers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendSupplierInvitationApprovedEmail = <T extends RecipientBase>({
    recipient,
    inviteeName,
    supplierCompanyName,
  }: SupplierInvitationApprovedArgs<T>) => {
    return addJobSendHubspotEmailToQueue<SupplierInvitationApprovedData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.SUPPLIER_INVITATION_APPROVED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        invitee_name: inviteeName,
        supplier_company_name: supplierCompanyName,
        share_emission_link: `${this.webAppBaseUrl}/value-chain/suppliers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendCustomerInvitationDeclinedEmail = <T extends RecipientBase>({
    recipient,
    inviteeName,
    inviteeCompanyName,
  }: CustomerInvitationDeclinedArgs<T>) => {
    return addJobSendHubspotEmailToQueue<CustomerInvitationDeclinedData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.CUSTOMER_INVITATION_DECLINED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        invitee_name: inviteeName,
        invitee_company_name: inviteeCompanyName,
        my_network_link: `${this.webAppBaseUrl}/account-settings/customers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendSupplierInvitationDeclinedEmail = <T extends RecipientBase>({
    recipient,
    inviteeName,
    inviteeCompanyName,
  }: SupplierInvitationDeclinedArgs<T>) => {
    return addJobSendHubspotEmailToQueue<SupplierInvitationDeclinedData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.SUPPLIER_INVITATION_DECLINED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        invitee_name: inviteeName,
        invitee_company_name: inviteeCompanyName,
        my_network_link: `${this.webAppBaseUrl}/account-settings/suppliers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendEmissionAllocationRequestEmail = <T extends RecipientBase>({
    recipient,
    customerCompanyName,
    emissionYear,
  }: EmissionAllocationRequestEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<EmissionAllocationRequestEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.EMISSION_ALLOCATION_REQUESTED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        customer_company_name: customerCompanyName,
        emission_year: emissionYear,
        emission_request_link: `${this.webAppBaseUrl}/value-chain/pending-requests`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendEmissionAllocationSubmittedEmail = <T extends RecipientBase>({
    recipient,
    supplierCompanyName,
    emissionYear,
  }: EmissionAllocationSubmittedEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<EmissionAllocationSubmittedEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.EMISSION_ALLOCATION_SUBMITTED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        supplier_company_name: supplierCompanyName,
        emission_year: emissionYear,
        emission_request_link: `${this.webAppBaseUrl}/value-chain/pending-requests`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendEmissionAllocationAcceptedEmail = <T extends RecipientBase>({
    recipient,
    customerCompanyName,
    emissionYear,
  }: EmissionAllocationAcceptedEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<EmissionAllocationAcceptedEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.EMISSION_ALLOCATION_ACCEPTED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        customer_company_name: customerCompanyName,
        emission_year: emissionYear,
        value_chain_link: `${this.webAppBaseUrl}/value-chain/customers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendEmissionAllocationRejectedEmail = <T extends RecipientBase>({
    recipient,
    customerCompanyName,
    emissionYear,
  }: EmissionAllocationRequestEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<EmissionAllocationRejectedEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.EMISSION_ALLOCATION_REJECTED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        customer_company_name: customerCompanyName,
        emission_year: emissionYear,
        value_chain_link: `${this.webAppBaseUrl}/value-chain/customers`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendEmissionAllocationUpdatedEmail = <T extends RecipientBase>({
    recipient,
    emissionYear,
    supplierCompanyName,
  }: EmissionAllocationUpdatedEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<EmissionAllocationUpdatedEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.EMISSION_ALLOCATION_UPDATED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        supplier_company_name: supplierCompanyName,
        emission_year: emissionYear,
        value_chain_link: `${this.webAppBaseUrl}/value-chain/pending-requests`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendEmissionAllocationDeletedEmail = <T extends RecipientBase>({
    recipient,
    supplierCompanyName,
    emissionYear,
    emissionAmount,
  }: EmissionAllocationDeletedEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<EmissionAllocationDeletedEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.EMISSION_ALLOCATION_DELETED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        supplier_company_name: supplierCompanyName,
        emission_year: emissionYear,
        emission_amount: emissionAmount,
        dashboard_link: `${this.webAppBaseUrl}/dashboard`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendUnableToInviteCompanyEmail = <T extends RecipientBase>({
    recipient,
    inviteeName,
    inviteeCompanyName,
  }: UnableToInviteCompanyEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<UnableToInviteCompanyEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.UNABLE_TO_INVITE_COMPANY
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        invitee_name: inviteeName,
        invitee_company_name: inviteeCompanyName,
        my_network_link: `${this.webAppBaseUrl}/account-settings`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendRegistrationUnsuccessfulEmail = <T extends RecipientBase>({
    recipient,
  }: RegistrationUnsuccessfulEmailArgs<T>) => {
    return addJobSendHubspotEmailToQueue<RegistrationUnsuccessfulEmailData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.REGISTRATION_UNSUCCESSFUL
      ),
      messageBody: { to: recipient.email },
      customProperties: {},
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendJoiningInvitationDeclined = <T extends RecipientBase>({
    recipient,
    inviteeCompanyName,
    inviteeName,
    declineReason,
  }: JoiningInvitationDeclinedArgs<T>) => {
    return addJobSendHubspotEmailToQueue<JoiningInvitationDeclinedData>({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.JOINING_INVITATION_DECLINED
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        invitee_name: inviteeName,
        invitee_company_name: inviteeCompanyName,
        decline_reason: declineReason,
        my_network_link: `${this.webAppBaseUrl}/account-settings`,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public resendInviteToJoinEmail = <T extends RecipientBase>({
    recipient,
    inviterName,
    inviterCompanyName,
    invitationLink,
  }: ResendInviteToJoinArgs<T>) => {
    return addJobSendHubspotEmailToQueue({
      emailId: this.getTransactionalEmailId(
        HubspotEmails.RESEND_INVITE_TO_JOIN
      ),
      messageBody: { to: recipient.email },
      customProperties: {
        inviter_name: inviterName,
        customer_company_name: inviterCompanyName,
        invitation_link: invitationLink,
      },
      contactProperties: {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
    });
  };

  public sendDataShareRequestEmail = <T extends RecipientBase>({
    recipient,
    requesterName,
    requesterCompanyName,
  }: DataShareRequestEmailArgs<T>) => {
    return this.sendTransactionalEmail(
      this.getTransactionalEmailId(HubspotEmails.DATA_SHARE_REQUEST),
      { to: recipient.email },
      {
        firstname: recipient.firstName,
        lastname: recipient.lastName,
      },
      {
        user_name: requesterName,
        company_name: requesterCompanyName,
      }
    );
  };
}

export const hubspotEmail = new HubspotEmailClient(
  new HubspotClient(getConfig().hubspotEmailToken)
);
