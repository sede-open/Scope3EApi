import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { button } from './partials/button';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  supplierName: string;
  allocationYear: number;
  ctaLink: string;
  emissions: number;
}

const template = ({
  supplierName,
  allocationYear,
  ctaLink,
  emissions,
}: TemplateProps) => `
  ${header({ title: 'Emissions allocation deleted' })}
  ${paragraph({
    text: `<b>${supplierName}</b> has deleted the ${allocationYear} emissions ${emissions} tCO2e that they have previously allocated to your company. As a result, your Scope 3 data may have changed.`,
  })}
  ${button({ ctaLink, text: 'Go to my dashboard' })}
`;

export const ALLOCATION_DELETED_EMAIL_SUBJECT = 'Emissions allocation deleted';

export const getAllocationDeletedTemplate = ({
  ctaLink,
  allocationYear,
  supplierName,
  emissions,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      supplierName,
      allocationYear,
      ctaLink,
      emissions,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: ALLOCATION_DELETED_EMAIL_SUBJECT,
  };
};
