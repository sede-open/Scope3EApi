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
  ${header({ title: 'You have a new request' })}
  ${paragraph({
    text: `
      <b>${customerName}</b> has requested that you allocate the ${allocationYear} emissions for their company.
    `,
  })}
  ${button({ ctaLink, text: 'View requests' })}
`;

export const ALLOCATION_REQUESTED_EMAIL_SUBJECT = 'You have a new request';

export const getAllocationRequestedTemplate = ({
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
    subject: ALLOCATION_REQUESTED_EMAIL_SUBJECT,
  };
};
