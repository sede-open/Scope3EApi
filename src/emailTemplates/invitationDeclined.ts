import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  declineeName: string;
  declineeCompanyName: string;
  declineReason: string;
}

const template = ({
  declineeName,
  declineeCompanyName,
  declineReason,
}: TemplateProps) => `
  ${header({ title: 'Invitation declined' })}
  ${paragraph({
    text: `<b>${declineeName}</b> from <b>${declineeCompanyName}</b> declined your invite to join the Hub, stating: <b>${declineReason}</b>.`,
  })}
  ${paragraph({
    text: `The company has been removed from your network. It will not appear in your account settings. Before you re-invite this company we advise you to contact them and confirm their details.`,
  })}
  ${paragraph({
    text: `For any questions, please feel free to contact us at <a class="text-link" href="mailto:APP-Support@example.com">APP-Support@example.com</a>`,
  })}
`;

export const INVITATION_DECLINED_EMAIL_SUBJECT = 'Your invitation was declined';

export const getInvitationDeclinedTemplate = ({
  declineeName,
  declineeCompanyName,
  declineReason,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      declineeName,
      declineeCompanyName,
      declineReason,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: INVITATION_DECLINED_EMAIL_SUBJECT,
  };
};
