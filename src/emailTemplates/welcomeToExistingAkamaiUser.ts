import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { button } from './partials/button';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  signInCTA: string;
}

const template = ({ signInCTA }: TemplateProps) => `
  ${header({
    title: 'Welcome to the <br> Example Supplier Energy Transition Hub',
  })}
  ${paragraph({
    text: `
      Your company has been successfully registered.
      Please click on the button below to sign in using your existing Example account credentials. 
    `,
  })}
  ${button({ ctaLink: signInCTA, text: 'Sign in' })}
  ${paragraph({
    text: `
      For any questions, please feel free to contact us at
      <br>
      <a class="text-link" href="mailto:APP-Support@example.com?subject=Welcome%20to%20the%20Hub">
        APP-Support@example.com
      </a>
    `,
  })}
`;

export const WELCOME_TO_EXISTING_AKAMAI_USER_EMAIL_SUBJECT =
  'Welcome to the Hub';

export const getWelcomeToExistingAkamaiUserTemplate = ({
  signInCTA,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({ signInCTA }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: WELCOME_TO_EXISTING_AKAMAI_USER_EMAIL_SUBJECT,
  };
};
