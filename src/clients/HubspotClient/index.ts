import fetch from 'node-fetch';
import { CustomPropertiesTypes } from '../../jobs/tasks/email/types';
import { ISendSingleTransactionalEmailMessageBody } from '../HubspotEmailClient/types';
import {
  HubspotCompanyBody,
  HubspotCompanyProperties,
  ContactBody,
  ContactProperties,
  HubspotObject,
  IEmailSendStatusResponse,
} from './types';
import { FetchOptions, Response } from '../types';

export class HubspotClient {
  private apiBase = 'https://api.hubapi.com';

  constructor(private readonly authToken: string) {}

  private async request(
    path: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    { body, headers, queryParams }: FetchOptions<unknown> = {}
  ) {
    const searchParams = new URLSearchParams(queryParams);

    const res = await fetch(`${this.apiBase}${path}?${searchParams}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
        ...(headers ? headers : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message;
      try {
        const resp = await res.json();
        message = resp.message;
      } catch {
        message = res.statusText;
      }
      throw new Error(message);
    }

    try {
      return await res.json();
    } catch (error) {
      // Delete request does not respond with json
      return;
    }
  }

  private marketingRequest(
    path: string,
    method: 'GET' | 'POST',
    fetchOptions?: FetchOptions<unknown>
  ) {
    return this.request(`/marketing/v3${path}`, method, fetchOptions);
  }

  private contactRequest(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    fetchOptions?: FetchOptions<ContactBody>
  ) {
    return this.request(
      `/crm/v3/objects/contacts${path}`,
      method,
      fetchOptions
    );
  }

  private companyRequest(
    path: string,
    method: 'GET' | 'POST' | 'PATCH',
    fetchOptions?: FetchOptions<HubspotCompanyBody>
  ) {
    return this.request(
      `/crm/v3/objects/companies${path}`,
      method,
      fetchOptions
    );
  }

  public sendTransactionalEmailRequest(
    emailId: number,
    message: Partial<ISendSingleTransactionalEmailMessageBody> & {
      to: string;
    },
    contactProperties: Partial<ContactBody['properties']>,
    customProperties: CustomPropertiesTypes
  ) {
    return this.marketingRequest('/transactional/single-email/send', 'POST', {
      body: {
        message,
        contactProperties,
        customProperties,
        emailId,
      },
    });
  }

  public getEmailSendStatus(
    statusId: string
  ): Promise<Response<IEmailSendStatusResponse>> {
    return this.marketingRequest(`/email/send-statuses/${statusId}`, 'GET');
  }

  public createContactRequest(data: ContactProperties): Promise<HubspotObject> {
    return this.contactRequest('', 'POST', {
      body: {
        properties: {
          firstname: data.firstName,
          lastname: data.lastName,
          email: data.email,
          user_status: data.status,
          invited_at: data.createdAt,
          user_role: data.roles,
          company: data.companyName,
          inviter_name: data.inviterName,
          inviter_company: data.inviterCompanyName,
          invite_link: data.inviteLink,
        },
      },
    });
  }

  public updateContactRequest(
    contactId: string,
    data: ContactProperties
  ): Promise<HubspotObject> {
    return this.contactRequest(`/${contactId}`, 'PATCH', {
      body: {
        properties: {
          firstname: data.firstName,
          lastname: data.lastName,
          email: data.email,
          user_status: data.status,
          invited_at: data.createdAt,
          user_role: data.roles,
          company: data.companyName,
        },
      },
    });
  }

  public deleteContactRequest(contactId: string): Promise<void> {
    return this.contactRequest(`/${contactId}`, 'DELETE');
  }

  public associateContactWithCompany(
    contactId: string,
    companyId: string
  ): Promise<HubspotObject> {
    return this.contactRequest(
      `/${contactId}/associations/company/${companyId}/1`,
      'PUT'
    );
  }

  public createCompanyRequest(
    data: HubspotCompanyProperties
  ): Promise<HubspotObject> {
    return this.companyRequest('', 'POST', {
      body: {
        properties: {
          name: data.name,
          company_status: data.status,
          country: data.dnbCountry ?? '',
          baseline_emissions__scope_1_: data.baselineScope1,
          last_year_s_emissions__scope_1_: data.lastYearScope1,
          ambition: data.ambition,
          first_supplier_invited: data.firstSupplierInvited,
          first_customer_invited: data.firstCustomerInvited,
          emissions_allocation: data.emissionsAllocation,
        },
      },
    });
  }

  public updateCompanyRequest(
    companyId: string,
    data: HubspotCompanyProperties
  ): Promise<HubspotObject> {
    return this.companyRequest(`/${companyId}`, 'PATCH', {
      body: {
        properties: {
          name: data.name,
          company_status: data.status,
          country: data.dnbCountry ?? '',
          baseline_emissions__scope_1_: data.baselineScope1,
          last_year_s_emissions__scope_1_: data.lastYearScope1,
          ambition: data.ambition,
          first_supplier_invited: data.firstSupplierInvited,
          first_customer_invited: data.firstCustomerInvited,
          emissions_allocation: data.emissionsAllocation,
        },
      },
    });
  }
}
