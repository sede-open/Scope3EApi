import fetch from 'node-fetch';

export interface IMulesoftEmailPayload {
  recipient: string;
  subject: string;
  body: string;
  from?: string;
}

interface sendMulesoftEmailApiBody {
  subject: string;
  emailBody: string;
  toEmail: string;
  fromEmail: string;
  ContentType: 'text/html';
  ccEmail?: string;
  bccEmail?: string;
}

interface sendMulesoftEmailApiResponse {
  message?: string;
  correlationId?: string;
  exception?: {
    exceptionCode: string;
    timeStamp: string;
    cause: string;
  };
}

export const EMAIL_SEND_SUCCESS_RESPONSE = {
  message: 'Email successfully sent to recipient.',
};

export interface IMulesofEmailService {
  sendEmail(payload: IMulesoftEmailPayload): Promise<{ message: string }>;
}

export class MulesoftEmailClient implements IMulesofEmailService {
  constructor(
    private sendEmailApiUrl: string,
    private sendEmailClientId: string,
    private sendEmailClientSecret: string
  ) {}

  public async sendEmail(payload: IMulesoftEmailPayload) {
    try {
      await this.sendEmailRequest(payload);
    } catch (e) {
      throw new Error(`Email send request failed: ${e.message}`);
    }

    return EMAIL_SEND_SUCCESS_RESPONSE;
  }

  public async sendEmailRequest(payload: IMulesoftEmailPayload) {
    const response = await fetch(this.sendEmailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        client_id: this.sendEmailClientId,
        client_secret: this.sendEmailClientSecret,
      },
      body: JSON.stringify(this.buildEmailRequestBody(payload)),
    });

    let body: sendMulesoftEmailApiResponse;
    try {
      body = await response.json();
    } catch (e) {
      throw new Error(this.getError(response.status));
    }

    if (!response.ok || body.exception) {
      throw new Error(this.getError(response.status, body));
    }
  }

  private buildEmailRequestBody(
    payload: IMulesoftEmailPayload
  ): sendMulesoftEmailApiBody {
    return {
      ContentType: 'text/html',
      emailBody: payload.body,
      fromEmail: payload.from || 'no-reply@example.com',
      subject: payload.subject,
      toEmail: payload.recipient,
    };
  }

  private getError(
    statusCode: number,
    response?: sendMulesoftEmailApiResponse
  ) {
    const msg = response?.exception?.cause
      ? `, message: "${response.exception.cause}"`
      : '';
    const id = response?.correlationId
      ? ` (correlation ID: ${response.correlationId})`
      : '';

    return `HTTP ${statusCode}${msg}${id}.`;
  }
}

export const mulesoft = new MulesoftEmailClient(
  process.env.MULESOFT_API_URL ?? '',
  process.env.MULESOFT_API_CLIENT_ID ?? '',
  process.env.MULESOFT_API_CLIENT_SECRET ?? ''
);
