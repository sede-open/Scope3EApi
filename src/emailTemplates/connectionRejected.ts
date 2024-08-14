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
    'has declined to be connected as your supplier on Supplier Energy Transition Hub. You may resend another invite to connect.',
  customer:
    'has declined to be connected as your customer on Supplier Energy Transition Hub. You may resend another invite to connect.',
};

const template = ({
  connectionName,
  ctaLink,
  connectionType,
}: TemplateProps) => `
  ${header({ title: 'Invitation declined' })}
  ${paragraph({
    text: `<b>${connectionName}</b> ${message[connectionType]}`,
  })}
  ${button({ ctaLink, text: 'Go to My network' })}
`;

export const CONNECTION_REJECTED_EMAIL_SUBJECT = 'Invitation declined';

export const getConectionRejectedTemplate = ({
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
    subject: CONNECTION_REJECTED_EMAIL_SUBJECT,
  };
};
