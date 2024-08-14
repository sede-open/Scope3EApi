import mjml2html from 'mjml';
import { companyInviteNotificationLayout } from './layouts/companyInviteNotificationLayout';
import { Tundora } from './colours';

const template = () => `
  <mj-column width="100%">
    <mj-text align="center" color="${Tundora}" font-size="18px" font-weight="bold" line-height="26px" padding="48px 0 0 0">
      Welcome to the 
    </mj-text>
    <mj-text align="center" color="${Tundora}" font-size="18px" font-weight="bold" line-height="26px" padding="0 0 18px 0">
      Example Supplier Energy Transition Hub
    </mj-text>
  </mj-column>
  <mj-column width="100%">
    <mj-text color="${Tundora}" font-size="14px" align="center" line-height="20px">
      Your company has been successfully registered. To start using the 
       <mj-text color="${Tundora}" font-size="14px" align="center" line-height="20px">
        <a class="text-link" href="https://abcd.example.com">
          Hub, 
        </a>
      </mj-text>
      <mj-text color="${Tundora}" font-size="14px" align="center" line-height="20px" padding="0 0 12px 0">
        <b>please activate your account by clicking on the activation link sent to you via email</b>. If you cannot find the email in your inbox, please check your spam folder for an email from the do-not-reply<span>@</span><span>example</span>.com address.
      </mj-text>
    </mj-text>
  </mj-column>
  <mj-column width="100%">
    <mj-text font-size="14px" color="${Tundora}" align="center" margin-bottom="0" padding="20px 0 0 0">
      For any questions, please feel free to contact us at
    </mj-text>
    <mj-text font-size="14px" color="${Tundora}" align="center">
      <a class="text-link" href="mailto:APP-Support@example.com">
        APP-Support@example.com
      </a>
    </mj-text>
  </mj-column>
`;

export const WELCOME_EMAIL_SUBJECT =
  'Welcome to the Example Supplier Energy Transition Hub';

export const getCompanyInviteWelcomeTemplate = () => {
  const mjml = companyInviteNotificationLayout({
    body: template(),
  });

  return {
    template: mjml2html(mjml).html,
    subject: WELCOME_EMAIL_SUBJECT,
  };
};
