import { getInviteLink } from './utils';
import { getInviteToJoinTemplate } from '../../emailTemplates/inviteToJoin';
import { UserEntity } from '../../entities/User';
import { addJobSendEmailToQueue } from '../../jobs/tasks/email/queue';
import { CompanyEntity } from '../../entities/Company';
import { getNewCompanyToVetTemplate } from '../../emailTemplates/newCompanyToVet';
import { getInvitationDeclinedTemplate } from '../../emailTemplates/invitationDeclined';
import { getCompanyVetoedInviterTemplate } from '../../emailTemplates/companyVetoedForInviter';
import { getCompanyVetoedInviteeTemplate } from '../../emailTemplates/companyVetoedForInvitee';
import { getWelcomeToNewAkamaiUserTemplate } from '../../emailTemplates/welcomeToNewAkamaiUser';
import { getWelcomeToExistingAkamaiUserTemplate } from '../../emailTemplates/welcomeToExistingAkamaiUser';
import { getUserRemovedFromCompanyTemplate } from '../../emailTemplates/userRemovedFromCompany';

export class NotificationClient {
  public notifyOfInviteToJoin = ({
    sender,
    recipient,
  }: {
    sender: UserEntity;
    recipient: UserEntity;
  }) => {
    const inviteeName = recipient.firstName;
    const inviterName = `${sender.firstName} ${sender.lastName}`;
    const inviterCompanyName = sender.company?.name ?? '';
    const inviteLink = getInviteLink(recipient);

    const { template, subject } = getInviteToJoinTemplate({
      inviteeName,
      inviterName,
      inviterCompanyName,
      inviteLink,
    });

    return addJobSendEmailToQueue({
      recipient: recipient.email,
      subject,
      body: template,
    });
  };

  public notifyOfCompanyToBeVetted = ({
    company,
  }: {
    company: CompanyEntity;
  }) => {
    const { template, subject } = getNewCompanyToVetTemplate({
      companyCountry: company.dnbCountry,
      companyName: company.name,
      ctaLink: `${process.env.WEB_APP_BASE_URL}/admin-dashboard/users`,
    });

    addJobSendEmailToQueue({
      recipient: process.env.XYZ_EMAIL_ADDRESS ?? '',
      subject,
      body: template,
    });
  };

  public notifyOfDeclinedInvitation = ({
    declinee,
    declineeCompany,
    recipient,
    declineReason,
  }: {
    declinee: UserEntity;
    declineeCompany: CompanyEntity;
    recipient: UserEntity;
    declineReason: string;
  }) => {
    const { template, subject } = getInvitationDeclinedTemplate({
      declineeName: `${declinee.firstName} ${declinee.lastName}`,
      declineeCompanyName: declineeCompany.name,
      declineReason,
    });

    return addJobSendEmailToQueue({
      recipient: recipient.email,
      subject,
      body: template,
    });
  };

  public notifyInviterOfVetoedCompany = ({
    inviteeName,
    inviteeCompanyName,
    recipient,
  }: {
    inviteeName: string;
    inviteeCompanyName: string;
    recipient: UserEntity;
  }) => {
    const { template, subject } = getCompanyVetoedInviterTemplate({
      inviteeName,
      inviteeCompanyName,
    });

    return addJobSendEmailToQueue({
      recipient: recipient.email,
      subject,
      body: template,
    });
  };

  public notifyInviteeOfVetoedCompany = ({
    recipient,
  }: {
    recipient: UserEntity;
  }) => {
    const { template, subject } = getCompanyVetoedInviteeTemplate({
      hubCTA: process.env.WEB_APP_BASE_URL ?? '',
    });

    return addJobSendEmailToQueue({
      recipient: recipient.email,
      subject,
      body: template,
    });
  };

  public notifyNewAkamaiUserOfApprovedCompany = ({
    recipient,
  }: {
    recipient: UserEntity;
  }) => {
    const { template, subject } = getCompanyVetoedInviteeTemplate({
      hubCTA: process.env.WEB_APP_BASE_URL ?? '',
    });

    addJobSendEmailToQueue({
      recipient: recipient.email,
      subject,
      body: template,
    });
  };

  public notifyNewAkamaiUserWelcome = ({
    recipient,
  }: {
    recipient: UserEntity;
  }) => {
    const { template, subject } = getWelcomeToNewAkamaiUserTemplate({
      hubCTA: process.env.WEB_APP_BASE_URL ?? '',
    });

    addJobSendEmailToQueue({
      recipient: recipient.email,
      subject,
      body: template,
    });
  };

  public notifyExistingAkamaiUserWelcome = ({
    recipient,
  }: {
    recipient: UserEntity;
  }) => {
    const { template, subject } = getWelcomeToExistingAkamaiUserTemplate({
      signInCTA: `${process.env.WEB_APP_BASE_URL}/auth/akamai`,
    });

    addJobSendEmailToQueue({
      recipient: recipient.email,
      subject,
      body: template,
    });
  };

  public notifyUserRemovedFromCompany = ({
    removedUserEmail,
  }: {
    removedUserEmail: string;
  }) => {
    const { template, subject } = getUserRemovedFromCompanyTemplate({
      removedUserEmail,
    });

    addJobSendEmailToQueue({
      recipient: process.env.XYZ_EMAIL_ADDRESS ?? '',
      subject,
      body: template,
    });
  };
}
