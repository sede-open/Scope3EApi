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
    text: `
      <b>${supplierName}</b> has sent you their ${allocationYear} emissions data. You can either accept or reject these emissions, as part of your Scope 3 total.
    `,
  })}
  ${button({ ctaLink, text: 'View requests' })}
`;

export const ALLOCATION_SUBMITTED_EMAIL_SUBJECT = 'You have a new request';

export const getAllocationSubmissionTemplate = ({
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
    subject: ALLOCATION_SUBMITTED_EMAIL_SUBJECT,
  };
};
