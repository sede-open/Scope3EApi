import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

interface TemplateProps {
  hubCTA: string;
}

const template = ({ hubCTA }: TemplateProps) => `
  ${header({
    title: 'Welcome to the <br> Example Supplier Energy Transition Hub',
  })}
  ${paragraph({
    text: `
      Your company has been successfully registered.
      To start using the
      <a class="text-link" href="${hubCTA}">Hub</a>,
      <b>please activate your account by clicking on the activation link sent to you via email</b>.
      If you cannot find the email in your inbox,
      please check your spam folder for an email from the
      <a class="non-link" href="mailto:do-not-reply@example.com">
        do-not-reply@example.com
      </a>
    `,
  })}
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

export const WELCOME_TO_NEW_AKAMAI_USER_EMAIL_SUBJECT = 'Welcome to the Hub';

export const getWelcomeToNewAkamaiUserTemplate = ({
  hubCTA,
}: TemplateProps) => {
  const mjml = notificationLayout({
    body: template({ hubCTA }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: WELCOME_TO_NEW_AKAMAI_USER_EMAIL_SUBJECT,
  };
};
