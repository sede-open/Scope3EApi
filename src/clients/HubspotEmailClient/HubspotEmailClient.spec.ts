import { Environment, Flags, getConfig } from '../../config';
import { HubspotEmailClient } from '.';
import { addJobSendHubspotEmailToQueue } from '../../jobs/tasks/email/queue';
import {
  HUBSPOT_EMAIL_ID,
  TEST_HUBSPOT_EMAIL_ID,
  WHITELISTED_EMAILS,
} from '../../constants/hubspot';
import { HubspotEmails } from './constants';
import { HubspotClient } from '../HubspotClient';

jest.mock('../HubspotClient', () => ({
  HubspotClient: jest.fn().mockReturnValue({
    sendTransactionalEmailRequest: jest.fn(),
  }),
}));
jest.mock('../../jobs/tasks/email/queue', () => ({
  addJobSendHubspotEmailToQueue: jest.fn(),
}));
jest.mock('../../config', () => {
  const actual = jest.requireActual('../../config');
  return {
    ...actual,
    getConfig: jest.fn().mockReturnValue({
      flags: {},
    }),
  };
});

const HUBSPOT_EMAIL_AUTH_TOKEN = 'HUBSPOT_EMAIL_AUTH_TOKEN';

describe(HubspotEmailClient.name, () => {
  describe('sendTransactionalEmail()', () => {
    const emailId = 123456789;
    const payload = {
      to: 'exampleUser@example.com',
    };
    const contactProperties = {
      firstname: 'firstname',
    };

    const hubspotClient = new HubspotClient(HUBSPOT_EMAIL_AUTH_TOKEN);
    const hubspotEmailClient = new HubspotEmailClient(hubspotClient);

    const customProperties = {};

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('does not fetch when no Hubspot flag is enabled', async () => {
      await hubspotEmailClient.sendTransactionalEmail(
        emailId,
        payload,
        contactProperties,
        customProperties
      );

      expect(
        hubspotClient.sendTransactionalEmailRequest
      ).not.toHaveBeenCalled();
    });

    it('does not fetch when the flag is enabled, but the email is not in the whitelist in no production env', async () => {
      (getConfig as jest.Mock).mockImplementation(() => ({
        flags: {
          [Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED]: true,
        },
        environment: Environment.STAGING,
      }));
      await hubspotEmailClient.sendTransactionalEmail(
        emailId,
        payload,
        contactProperties,
        customProperties
      );
      expect(
        hubspotClient.sendTransactionalEmailRequest
      ).not.toHaveBeenCalled();
    });

    it('applies all args to the fetch call when one of the Hubspot flags is enabled in production env', async () => {
      (getConfig as jest.Mock).mockImplementation(() => ({
        flags: {
          [Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED]: true,
        },
        environment: Environment.PROD,
      }));
      await hubspotEmailClient.sendTransactionalEmail(
        emailId,
        payload,
        contactProperties,
        customProperties
      );

      expect(hubspotClient.sendTransactionalEmailRequest).toHaveBeenCalledTimes(
        1
      );
      expect(hubspotClient.sendTransactionalEmailRequest).toHaveBeenCalledWith(
        emailId,
        payload,
        contactProperties,
        customProperties
      );
    });

    it('applies all args to the fetch call when one of the Hubspot flags is enabled in no production env with a whitelisted recipient', async () => {
      (getConfig as jest.Mock).mockImplementation(() => ({
        flags: {
          [Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED]: true,
        },
        environment: Environment.STAGING,
      }));
      const whitelistedRecipient = WHITELISTED_EMAILS[0];
      const payloadWithWhitelistedRecipient = {
        ...payload,
        to: WHITELISTED_EMAILS[0],
      };

      expect(typeof whitelistedRecipient).toBe('string');
      expect(whitelistedRecipient).toBeTruthy();

      await hubspotEmailClient.sendTransactionalEmail(
        emailId,
        payloadWithWhitelistedRecipient,
        contactProperties,
        customProperties
      );

      expect(hubspotClient.sendTransactionalEmailRequest).toHaveBeenCalledTimes(
        1
      );
      expect(hubspotClient.sendTransactionalEmailRequest).toHaveBeenCalledWith(
        emailId,
        payloadWithWhitelistedRecipient,
        contactProperties,
        customProperties
      );
    });
  });

  describe.each`
    environment            | emailId
    ${Environment.PROD}    | ${HUBSPOT_EMAIL_ID}
    ${Environment.STAGING} | ${TEST_HUBSPOT_EMAIL_ID}
  `('send transactional emails', ({ environment, emailId }) => {
    const hubspotEmailClient = new HubspotEmailClient(
      new HubspotClient(HUBSPOT_EMAIL_AUTH_TOKEN)
    );
    const recipient = {
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'McTest',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterAll(() => {
      jest.clearAllMocks();
    });
    it.each`
      name                                      | method                                                     | emailIdKey
      ${'sendInviteCustomerEmail'}              | ${hubspotEmailClient.sendInviteCustomerEmail}              | ${HubspotEmails.INVITE_CUSTOMER}
      ${'sendInviteSupplierEmail'}              | ${hubspotEmailClient.sendInviteSupplierEmail}              | ${HubspotEmails.INVITE_SUPPLIER}
      ${'sendCustomerInvitationApprovedEmail'}  | ${hubspotEmailClient.sendCustomerInvitationApprovedEmail}  | ${HubspotEmails.CUSTOMER_INVITATION_APPROVED}
      ${'sendSupplierInvitationApprovedEmail'}  | ${hubspotEmailClient.sendSupplierInvitationApprovedEmail}  | ${HubspotEmails.SUPPLIER_INVITATION_APPROVED}
      ${'sendCustomerInvitationDeclinedEmail'}  | ${hubspotEmailClient.sendCustomerInvitationDeclinedEmail}  | ${HubspotEmails.CUSTOMER_INVITATION_DECLINED}
      ${'sendSupplierInvitationDeclinedEmail'}  | ${hubspotEmailClient.sendSupplierInvitationDeclinedEmail}  | ${HubspotEmails.SUPPLIER_INVITATION_DECLINED}
      ${'sendEmissionAllocationRequestEmail'}   | ${hubspotEmailClient.sendEmissionAllocationRequestEmail}   | ${HubspotEmails.EMISSION_ALLOCATION_REQUESTED}
      ${'sendEmissionAllocationSubmittedEmail'} | ${hubspotEmailClient.sendEmissionAllocationSubmittedEmail} | ${HubspotEmails.EMISSION_ALLOCATION_SUBMITTED}
      ${'sendEmissionAllocationAcceptedEmail'}  | ${hubspotEmailClient.sendEmissionAllocationAcceptedEmail}  | ${HubspotEmails.EMISSION_ALLOCATION_ACCEPTED}
      ${'sendEmissionAllocationRejectedEmail'}  | ${hubspotEmailClient.sendEmissionAllocationRejectedEmail}  | ${HubspotEmails.EMISSION_ALLOCATION_REJECTED}
      ${'sendEmissionAllocationUpdatedEmail'}   | ${hubspotEmailClient.sendEmissionAllocationUpdatedEmail}   | ${HubspotEmails.EMISSION_ALLOCATION_UPDATED}
      ${'sendEmissionAllocationDeletedEmail'}   | ${hubspotEmailClient.sendEmissionAllocationDeletedEmail}   | ${HubspotEmails.EMISSION_ALLOCATION_DELETED}
      ${'sendUnableToInviteCompanyEmail'}       | ${hubspotEmailClient.sendUnableToInviteCompanyEmail}       | ${HubspotEmails.UNABLE_TO_INVITE_COMPANY}
      ${'sendRegistrationUnsuccessfulEmail'}    | ${hubspotEmailClient.sendRegistrationUnsuccessfulEmail}    | ${HubspotEmails.REGISTRATION_UNSUCCESSFUL}
      ${'sendJoiningInvitationDeclined'}        | ${hubspotEmailClient.sendJoiningInvitationDeclined}        | ${HubspotEmails.JOINING_INVITATION_DECLINED}
      ${'resendInviteToJoinEmail'}              | ${hubspotEmailClient.resendInviteToJoinEmail}              | ${HubspotEmails.RESEND_INVITE_TO_JOIN}
    `(
      '"$name" adds a job with the correct Hubspot email id',
      async ({ method, emailIdKey }) => {
        (getConfig as jest.Mock).mockReturnValueOnce({
          environment,
          flags: {},
        });
        await method({ recipient });

        expect(addJobSendHubspotEmailToQueue).toBeCalledTimes(1);
        expect(addJobSendHubspotEmailToQueue).toBeCalledWith(
          expect.objectContaining({
            emailId: emailId[emailIdKey],
            messageBody: { to: recipient.email },
            contactProperties: {
              firstname: recipient.firstName,
              lastname: recipient.lastName,
            },
          })
        );
      }
    );

    it('sendDataShareRequestEmail calls HubSpot API to send the email', async () => {
      (getConfig as jest.Mock).mockReturnValueOnce({
        environment,
        flags: {},
      });
      hubspotEmailClient.sendTransactionalEmail = jest
        .fn()
        .mockResolvedValueOnce({});

      const recipient = {
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'McTest',
      };
      const requesterName = 'Requester Name';
      const requesterCompanyName = 'Requester Company Name';
      await hubspotEmailClient.sendDataShareRequestEmail({
        recipient,
        requesterName,
        requesterCompanyName,
      });
      expect(hubspotEmailClient.sendTransactionalEmail).toBeCalledWith(
        emailId[HubspotEmails.DATA_SHARE_REQUEST],
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
      jest.resetAllMocks();
    });
  });
});
