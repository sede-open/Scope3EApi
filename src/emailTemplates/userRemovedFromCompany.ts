import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';
import { button } from './partials/button';

interface TemplateProps {
  removedUserEmail: string;
}

export const USER_REMOVED_FROM_COMPANY_SUBJECT =
  'Notification of removal of user';

const AKAMAI_CONSOLE_LINK = 'https://example.janrain.com/#/login';

const template = ({ removedUserEmail }: TemplateProps) => `
  ${header({ title: USER_REMOVED_FROM_COMPANY_SUBJECT })}
  ${paragraph({
    text: `Please remove the following user from Akamai: <b>${removedUserEmail}</b>`,
  })}
  ${button({ ctaLink: AKAMAI_CONSOLE_LINK, text: 'Go to Akamai Console' })}
`;

export const getUserRemovedFromCompanyTemplate = ({
  removedUserEmail,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      removedUserEmail,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: USER_REMOVED_FROM_COMPANY_SUBJECT,
  };
};
