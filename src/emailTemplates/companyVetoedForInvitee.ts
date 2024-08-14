import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  hubCTA: string;
}

const template = ({ hubCTA }: TemplateProps) => `
  ${header({ title: 'Registration Unsuccessful' })}
  ${paragraph({
    text: `
      We regret to inform you that we are currently unable to proceed with the account registration for your Company.
      A member of our team will be in touch to explain why and explore how you could join the <a class="text-link" href="${hubCTA}">Hub</a>.
    `,
  })}
  ${paragraph({
    text: `
      For any questions, please feel free to contact us at
      <br>
      <a class="text-link" href="mailto:APP-Support@example.com?subject=Registration%20unsuccessful">
        APP-Support@example.com
      </a>
    `,
  })}
`;

export const COMPANY_VETOED_INVITEE_EMAIL_SUBJECT = 'Registration unsuccessful';

export const getCompanyVetoedInviteeTemplate = ({ hubCTA }: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({ hubCTA }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: COMPANY_VETOED_INVITEE_EMAIL_SUBJECT,
  };
};
