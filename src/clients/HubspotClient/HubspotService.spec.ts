import fetch from 'node-fetch';
import { HubspotClient } from '.';
import { CompanyStatus, UserStatus } from '../../types';
import { ContactProperties } from './types';

jest.mock('node-fetch', () =>
  jest
    .fn()
    .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) })
);

const HUBSPOT_AUTH_TOKEN = 'HUBSPOT_AUTH_TOKEN';
const hubspotClient = new HubspotClient(HUBSPOT_AUTH_TOKEN);

const baseUrl = 'https://api.hubapi.com';

describe(HubspotClient.name, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('sendTransactionalEmailRequest', () => {
    it('should send a request to Hubspot Single Send API', async () => {
      const emailId = 123456789;
      const message = { to: 'exampleUser@example.com' };
      const contactProperties = {
        firstname: 'firstname',
        lastname: 'lastname',
      };
      const customProperties = {};

      await hubspotClient.sendTransactionalEmailRequest(
        emailId,
        message,
        contactProperties,
        customProperties
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/marketing/v3/transactional/single-email/send?`,
        {
          body: JSON.stringify({
            message: {
              to: message.to,
            },
            contactProperties,
            customProperties,
            emailId,
          }),
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'POST',
        }
      );
    });
  });
  describe('getEmailSendStatus', () => {
    it('should call the Hubspot API to get the status for an email', async () => {
      const statusId = 'status-id';
      await hubspotClient.getEmailSendStatus(statusId);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/marketing/v3/email/send-statuses/${statusId}?`,
        {
          body: undefined,
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'GET',
        }
      );
    });
  });
  describe('createContactRequest', () => {
    it('should call the Hubspot API to create a contact', async () => {
      const contactProps: ContactProperties = {
        firstName: 'Test',
        lastName: 'McTest',
        email: 'test@test.com',
        status: UserStatus.Active,
        createdAt: new Date().toISOString(),
        roles: 'ADMIN;SUPPLIER_EDITOR;SUPPLIER_VIEWER',
        companyName: 'Test Company',
        inviterName: 'Test Inviter',
        inviterCompanyName: 'Test Inviter Company',
        inviteLink: 'https://test.com/invite',
      };
      await hubspotClient.createContactRequest(contactProps);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/crm/v3/objects/contacts?`,
        {
          body: JSON.stringify({
            properties: {
              firstname: contactProps.firstName,
              lastname: contactProps.lastName,
              email: contactProps.email,
              user_status: contactProps.status,
              invited_at: contactProps.createdAt,
              user_role: contactProps.roles,
              company: contactProps.companyName,
              inviter_name: contactProps.inviterName,
              inviter_company: contactProps.inviterCompanyName,
              invite_link: contactProps.inviteLink,
            },
          }),
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'POST',
        }
      );
    });
  });
  describe('updateContactRequest', () => {
    it('should call the Hubspot API to update a contact', async () => {
      const contactId = 'contact-id';
      const contactProps = {
        firstName: 'Test',
        lastName: 'McTest',
        email: 'test@test.com',
        status: UserStatus.Active,
        createdAt: new Date().toISOString(),
        roles: 'SUPPLIER_EDITOR;SUPPLIER_VIEWER',
        companyName: 'My Company',
      };
      await hubspotClient.updateContactRequest(contactId, contactProps);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/crm/v3/objects/contacts/${contactId}?`,
        {
          body: JSON.stringify({
            properties: {
              firstname: contactProps.firstName,
              lastname: contactProps.lastName,
              email: contactProps.email,
              user_status: contactProps.status,
              invited_at: contactProps.createdAt,
              user_role: contactProps.roles,
              company: contactProps.companyName,
            },
          }),
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'PATCH',
        }
      );
    });
  });
  describe('deleteContactRequest', () => {
    it('should call the Hubspot API to delete a contact', async () => {
      const contactId = 'contact-id';
      await hubspotClient.deleteContactRequest(contactId);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/crm/v3/objects/contacts/${contactId}?`,
        {
          body: undefined,
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'DELETE',
        }
      );
    });
  });
  describe('associateContactWithCompany', () => {
    it('should call the Hubspot API to associate a contact with company', async () => {
      const contactId = 'contact-id';
      const companyId = 'company-id';
      await hubspotClient.associateContactWithCompany(contactId, companyId);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/crm/v3/objects/contacts/${contactId}/associations/company/${companyId}/1?`,
        {
          body: undefined,
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'PUT',
        }
      );
    });
  });
  describe('createCompanyRequest', () => {
    it('should call the Hubspot API to create a company', async () => {
      const companyProps = {
        name: 'company-name',
        status: CompanyStatus.Active,
        dnbCountry: 'UK',
        baselineScope1: 4,
        lastYearScope1: 22,
        ambition: 42,
        firstSupplierInvited: <const>'True',
        firstCustomerInvited: <const>'True',
        emissionsAllocation: 31,
      };
      await hubspotClient.createCompanyRequest(companyProps);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/crm/v3/objects/companies?`,
        {
          body: JSON.stringify({
            properties: {
              name: companyProps.name,
              company_status: companyProps.status,
              country: companyProps.dnbCountry,
              baseline_emissions__scope_1_: companyProps.baselineScope1,
              last_year_s_emissions__scope_1_: companyProps.lastYearScope1,
              ambition: companyProps.ambition,
              first_supplier_invited: companyProps.firstSupplierInvited,
              first_customer_invited: companyProps.firstCustomerInvited,
              emissions_allocation: companyProps.emissionsAllocation,
            },
          }),
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'POST',
        }
      );
    });
  });
  describe('updateCompanyRequest', () => {
    it('should call the Hubspot API to update a company', async () => {
      const companyId = 'company-id';
      const companyProps = {
        name: 'company-name',
        status: CompanyStatus.Active,
        dnbCountry: 'UK',
        baselineScope1: 4,
        lastYearScope1: 22,
        ambition: 42,
        firstSupplierInvited: <const>'True',
        firstCustomerInvited: <const>'True',
        emissionsAllocation: 31,
      };
      await hubspotClient.updateCompanyRequest(companyId, companyProps);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/crm/v3/objects/companies/${companyId}?`,
        {
          body: JSON.stringify({
            properties: {
              name: companyProps.name,
              company_status: companyProps.status,
              country: companyProps.dnbCountry,
              baseline_emissions__scope_1_: companyProps.baselineScope1,
              last_year_s_emissions__scope_1_: companyProps.lastYearScope1,
              ambition: companyProps.ambition,
              first_supplier_invited: companyProps.firstSupplierInvited,
              first_customer_invited: companyProps.firstCustomerInvited,
              emissions_allocation: companyProps.emissionsAllocation,
            },
          }),
          headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
            Authorization: `Bearer ${HUBSPOT_AUTH_TOKEN}`,
          },
          method: 'PATCH',
        }
      );
    });
  });
});
