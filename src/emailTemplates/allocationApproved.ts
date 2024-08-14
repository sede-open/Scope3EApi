import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { button } from './partials/button';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  customerName: string;
  allocationYear: number;
  ctaLink: string;
}

const template = ({ customerName, allocationYear, ctaLink }: TemplateProps) => `
  ${header({ title: 'Emissions allocation accepted' })}
  ${paragraph({
    text: `<b>${customerName}</b> has accepted the ${allocationYear} emissions that you have allocated to their company.`,
  })}
  ${button({ ctaLink, text: 'Go to my value chain' })}
`;

export const ALLOCATION_APPROVED_EMAIL_SUBJECT =
  'Emissions allocation accepted';

export const getAllocationApprovedTemplate = ({
  ctaLink,
  allocationYear,
  customerName,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      customerName,
      allocationYear,
      ctaLink,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: ALLOCATION_APPROVED_EMAIL_SUBJECT,
  };
};
