import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { button } from './partials/button';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  connectionName: string;
  ctaLink: string;
  connectionType: 'supplier' | 'customer';
}

export const message = {
  supplier:
    'has invited you to connect as their supplier on Supplier Energy Transition Hub. By accepting the invite, you may share emissions data with',
  customer:
    'has invited you to connect as their customer on Supplier Energy Transition Hub. By accepting the invite, you may receive emissions data from',
};

const template = ({
  connectionName,
  ctaLink,
  connectionType,
}: TemplateProps) => `
  ${header({ title: 'You have received an invitation to connect' })}
  ${paragraph({
    text: `<b>${connectionName}</b> ${message[connectionType]} <b>${connectionName}</b>.`,
  })}
  ${button({ ctaLink, text: 'Go to My Network' })}
`;

export const NEW_CONNECTION_REQUEST_EMAIL_SUBJECT =
  'You have received an invitation to connect';

export const getNewConnectionRequestTemplate = ({
  connectionName,
  ctaLink,
  connectionType,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      connectionName,
      ctaLink,
      connectionType,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: NEW_CONNECTION_REQUEST_EMAIL_SUBJECT,
  };
};
