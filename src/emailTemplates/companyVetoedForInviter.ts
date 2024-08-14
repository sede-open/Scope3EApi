import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  inviteeName: string;
  inviteeCompanyName: string;
}

const template = ({ inviteeCompanyName, inviteeName }: TemplateProps) => `
  ${header({ title: `We are unable to invite ${inviteeCompanyName}` })}
  ${paragraph({
    text: `
      We are currently unable to invite ${inviteeName} from ${inviteeCompanyName} to join the Hub. A member of our team will be in touch to explore the next steps.
    `,
  })}
  ${paragraph({
    text: `
      For any questions, please feel free to contact us at
      <br>
      <a class="text-link" href="mailto:APP-Support@example.com?subject=Invitation%20to%20join%20the%20Hub%20failed">
        APP-Support@example.com
      </a>
    `,
  })}
`;

export const COMPANY_VETOED_INVITER_EMAIL_SUBJECT =
  'Invitation to join the Hub failed';

export const getCompanyVetoedInviterTemplate = ({
  inviteeName,
  inviteeCompanyName,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      inviteeName,
      inviteeCompanyName,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: COMPANY_VETOED_INVITER_EMAIL_SUBJECT,
  };
};
