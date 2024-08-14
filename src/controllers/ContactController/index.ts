import { ApolloError } from 'apollo-server-express';
import { EmailEnquiry, EnquiryEmailInput, RegionName } from '../../types';
import { EMAIL_ENQUIRIES } from '../../utils/enquiries';
import {
  ENQUIRY_NOT_SENT,
  FORBIDDEN_INPUT,
  INVALID_ENQUIRY,
  INVALID_REGION,
} from '../../utils/errorStrings';
import { logger } from '../../utils/logger';
import { isEveryInputSafe } from '../../utils/validators';
import { ControllerFunctionAsync } from '../types';

export interface IContactRequest {
  name: string;
  email: string;
  company?: string | null;
  enquiries: string[];
  regions?: RegionName[] | null;
  message: string;
  consent: boolean;
}

export const createSubjectLine = (enquiries: EmailEnquiry[]) => {
  if (enquiries.includes(EmailEnquiry.GeneralEnquiry)) {
    return 'New general enquiry';
  }
  if (enquiries.length > 1) {
    return 'Multiple solutions enquiry';
  }
  const enquiryName = EMAIL_ENQUIRIES[enquiries[0]];
  return 'Solution - ' + `${enquiryName}` + ' enquiry';
};

export class ContactController {
  private toEmail = ({
    consent,
    email,
    company,
    enquiries,
    message,
    name,
    regions,
  }: IContactRequest) => `
    <p>You have received an enquiry from the Supply Energy Tranisition Hub website.</p>
    <ul>
      <li><b>Name</b>: ${name}</li>
      <li><b>Email</b>: ${email}</li>
      <li><b>Company</b>: ${company}</li>
      <li><b>Enquiry Type</b>: ${enquiries.join(', ')}</li>
      <li><b>Region</b>: ${regions?.join(', ') || 'n/a'}</li>
      <li><b>Message</b>:<br/>${message}</li>
      <li><b>User provided consent</b>: ${consent ? 'Yes' : 'No'}</li>
    </ul>
  `;

  enquiryEmail: ControllerFunctionAsync<EnquiryEmailInput, string> = async (
    { consent, email, enquiries, message, name, regions, company },
    context
  ) => {
    if (!isEveryInputSafe([message, name, ...enquiries, ...(regions ?? [])])) {
      throw new ApolloError(FORBIDDEN_INPUT);
    }

    if (enquiries.length === 0) {
      throw new ApolloError(INVALID_ENQUIRY);
    }

    const needsRegion = !(
      enquiries.length === 1 && enquiries[0] === EmailEnquiry.GeneralEnquiry
    );

    if (needsRegion && (!regions || (regions && regions.length === 0))) {
      throw new ApolloError(INVALID_REGION);
    }

    const enquiryNames = enquiries.map((enquiry) => EMAIL_ENQUIRIES[enquiry]);

    try {
      const response = await context.clients.mulesoft.sendEmail({
        recipient: process.env.XYZ_EMAIL_ADDRESS ?? '',
        subject: createSubjectLine(enquiries).toUpperCase(),
        body: this.toEmail({
          consent,
          email,
          company,
          message,
          name,
          regions,
          enquiries: enquiryNames,
        }),
        from: 'no-reply@example.com',
      });

      return response.message;
    } catch (err) {
      logger.error(err);
      throw new ApolloError(ENQUIRY_NOT_SENT);
    }
  };
}
