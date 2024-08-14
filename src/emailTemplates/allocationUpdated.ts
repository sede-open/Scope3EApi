import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { button } from './partials/button';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  supplierName: string;
  allocationYear: number;
  ctaLink: string;
}

const template = ({ supplierName, allocationYear, ctaLink }: TemplateProps) => `
  ${header({ title: 'You have a new request' })}
  ${paragraph({
    text: `<b>${supplierName}</b> has updated the ${allocationYear} emissions that they have previously allocated to your company. You can either accept or decline this update, as part of your Scope 3 total.`,
  })}
  ${button({ ctaLink, text: 'Go to my value chain' })}
`;

export const ALLOCATION_UPDATED_EMAIL_SUBJECT = 'You have a new request';

export const getAllocationUpdatedTemplate = ({
  ctaLink,
  allocationYear,
  supplierName,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      supplierName,
      allocationYear,
      ctaLink,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: ALLOCATION_UPDATED_EMAIL_SUBJECT,
  };
};
