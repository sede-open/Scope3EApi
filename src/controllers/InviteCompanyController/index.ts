import { ApolloError } from 'apollo-server-express';
import { addJobSendEmailToQueue } from '../../jobs/tasks/email/queue';
import { FORBIDDEN_INPUT, INVALID_EMAIL } from '../../utils/errorStrings';
import { logger } from '../../utils/logger';
import { isEveryEmailValid, isEveryInputSafe } from '../../utils/validators';
import { ControllerFunctionAsync } from '../types';

export interface IInviteCompany {
  inviter: {
    company: string;
    email: string;
    name: string;
  };
  invitee: {
    company: string;
    email: string;
    name: string;
  };
}

export class InviteCompanyController {
  private toEmail = ({
    inviter: {
      company: inviterCompany,
      email: inviterEmail,
      name: inviterName,
    },
    invitee: {
      company: inviteeCompany,
      email: inviteeEmail,
      name: inviteeName,
    },
  }: IInviteCompany) => `
      <p>${inviterName} (${inviterEmail}) from ${inviterCompany} would like to invite a new company to join XYZ:</p>
      <ul>
        <li><b>Company name</b>: ${inviteeCompany}</li>
        <li><b>Contact name</b>: ${inviteeName}</li>
        <li><b>Contact email</b>: ${inviteeEmail}</li>
      </ul>
    `;
  inviteCompanyEmail: ControllerFunctionAsync<IInviteCompany, void> = async (
    args
  ) => {
    const { inviter, invitee } = args;

    if (
      !isEveryInputSafe([
        inviter.company,
        inviter.name,
        invitee.company,
        invitee.name,
      ])
    ) {
      throw new ApolloError(FORBIDDEN_INPUT);
    }

    if (!isEveryEmailValid([inviter.email, invitee.email])) {
      throw new ApolloError(INVALID_EMAIL);
    }

    try {
      addJobSendEmailToQueue({
        recipient: process.env.XYZ_EMAIL_ADDRESS ?? '',
        subject: 'New company invite request',
        body: this.toEmail({
          inviter,
          invitee,
        }),
      });
    } catch (err) {
      logger.error(err, 'Failed to add invite email to queue');
      throw Error(`Failed to add invite email to queue: ${err.message}`);
    }
  };
}
