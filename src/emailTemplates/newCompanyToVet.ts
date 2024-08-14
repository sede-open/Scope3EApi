import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { button } from './partials/button';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  companyName: string;
  companyCountry?: string | null;
  ctaLink: string;
}

const template = ({ companyName, companyCountry, ctaLink }: TemplateProps) => `
  ${header({ title: 'A new company is ready to be vetted' })}
  ${paragraph({
    text: `<b>${companyName}</b> (${
      companyCountry ?? '-'
    }) has opted to join XYZ and is ready to be vetted.`,
  })}
  ${button({ ctaLink, text: 'Go to dashboard' })}
`;

export const NEW_COMPANY_TO_VET_EMAIL_SUBJECT =
  'A new company is ready to be vetted';

export const getNewCompanyToVetTemplate = ({
  companyName,
  companyCountry,
  ctaLink,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({
      companyName,
      companyCountry,
      ctaLink,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: NEW_COMPANY_TO_VET_EMAIL_SUBJECT,
  };
};
