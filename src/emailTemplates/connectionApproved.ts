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
    'is now part of your supplier network on Supplier Energy Transition Hub. You may request for relevant emissions data from',
  customer:
    'is now part of your customer network on Supplier Energy Transition Hub. You may share relevant emissions data with',
};

export const ctaText = {
  supplier: 'Request emissions data',
  customer: 'Share emissions data',
};

export const ctaRoute = {
  supplier: '/suppliers',
  customer: '/customers',
};

const template = ({
  connectionName,
  ctaLink,
  connectionType,
}: TemplateProps) => `
  ${header({ title: 'You have a new connection' })}
  ${paragraph({
    text: `<b>${connectionName}</b> ${message[connectionType]} <b>${connectionName}</b>.`,
  })}
  ${button({
    ctaLink: ctaLink + ctaRoute[connectionType],
    text: ctaText[connectionType],
  })}
`;

export const CONNECTION_APPROVED_EMAIL_SUBJECT = 'You have a new connection';

export const getConectionApprovedTemplate = ({
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
    subject: CONNECTION_APPROVED_EMAIL_SUBJECT,
  };
};
