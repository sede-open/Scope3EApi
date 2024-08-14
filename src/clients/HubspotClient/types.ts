type SendResult =
  | 'SENT'
  | 'QUEUED'
  | 'PORTAL_SUSPENDED'
  | 'INVALID_TO_ADDRESS'
  | 'BLOCKED_DOMAIN'
  | 'PREVIOUSLY_BOUNCED'
  | 'PREVIOUS_SPAM'
  | 'INVALID_FROM_ADDRESS'
  | 'MISSING_CONTENT'
  | 'MISSING_TEMPLATE_PROPERTIES';

export interface IEmailSendStatusResponse {
  statusId: string;
  sendResult: SendResult;
  requestedAt: string;
  startedAt: string;
  completedAt: string;
  status: EmailSendStatus;
  eventId: {
    created: string;
    id: string;
  };
}

type EmailSendStatus = 'PENDING' | 'PROCESSING' | 'CANCELED' | 'COMPLETE';

export interface ISendTransactionalEmailResponse {
  statusId: string;
  requestedAt: string;
  status: EmailSendStatus;
}

export interface HubspotObject {
  id: string;
  properties: Record<string, unknown>;
}

export interface ContactProperties {
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  roles: string;
  companyName: string;
  inviterName?: string;
  inviterCompanyName?: string;
  inviteLink?: string;
}

export interface ContactBody {
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    user_status: string;
    invited_at: string;
    user_role: string;
    company: string; // company name
    inviter_name?: string;
    inviter_company?: string; // company name
    invite_link?: string;
  };
}

type HubspotBoolean = 'True' | 'False';

export interface HubspotCompanyProperties {
  name: string;
  status: string;
  dnbCountry?: string | null;
  baselineScope1?: number;
  lastYearScope1?: number | ''; // empty string resets the value
  ambition?: number | ''; // empty string resets the value
  firstSupplierInvited?: HubspotBoolean;
  firstCustomerInvited?: HubspotBoolean;
  emissionsAllocation?: number;
}

export interface HubspotCompanyBody {
  properties: {
    name: string;
    company_status: string;
    country?: string;
    baseline_emissions__scope_1_?: number;
    last_year_s_emissions__scope_1_?: number | ''; // empty string resets the value
    ambition?: number | ''; // empty string resets the value
    first_supplier_invited?: HubspotBoolean;
    first_customer_invited?: HubspotBoolean;
    emissions_allocation?: number;
  };
}
