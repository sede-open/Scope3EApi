import mjml2html from 'mjml';
import { notificationLayout } from './layouts/notificationLayout';
import { header } from './partials/header';
import { paragraph } from './partials/paragraph';

const template = () => `
  ${header({
    title: `Welcome to the <br> Example Supplier Energy Transition Hub`,
  })}
  ${paragraph({
    text: `
      Your company has been successfully registered.
      To start using the Hub,
      <b>please activate your account by clicking on the activation link sent to you via email</b>.
      If you cannot find the email in your inbox,
      please check your spam folder for an email from the do-not-reply@example.com address.
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

export const NEW_USER_WELCOME_EMAIL_SUBJECT = 'Welcome to the Hub';

export const getNewUserWelcomeTemplate = () => {
  const mjml = notificationLayout({
    body: template(),
  });

  return {
    template: mjml2html(mjml).html,
    subject: NEW_USER_WELCOME_EMAIL_SUBJECT,
  };
};
