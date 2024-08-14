import mjml2html from 'mjml';
import { companyInviteNotificationLayout } from './layouts/companyInviteNotificationLayout';
import { Tundora } from './colours';

const template = () => `
  <mj-column width="100%">
    <mj-text align="center" color="${Tundora}" font-size="18px" font-weight="bold" line-height="26px" padding="48px 0 18px 0">
      Registration Unsuccessful
    </mj-text>
  </mj-column>
  <mj-column width="100%">
    <mj-text color="${Tundora}" font-size="14px" align="center" line-height="20px" padding="0 0 12px 0">
      We regret to inform you that we are currently unable to proceed with the account registration for your Company. A member of our team will be in touch with you shortly to explain why and explore how you could join the
      <mj-text color="${Tundora}" font-size="14px" align="center" line-height="20px" padding="0 0 12px 0">
        <a class="text-link" href="https://abcd.example.com">
          Hub
        </a>
      </mj-text>
      - please look out for our email.
    </mj-text>
  </mj-column>
  <mj-column width="100%">
    <mj-text font-size="14px" color="${Tundora}" align="center" margin-bottom="0" padding-bottom="0">
      For any questions, please feel free to contact us at
    </mj-text>
    <mj-text font-size="14px" color="${Tundora}" align="center">
      <a class="text-link" href="mailto:APP-Support@example.com">
        APP-Support@example.com
      </a>
    </mj-text>
  </mj-column>
`;

export const COMPANY_REJECTED_REGISTRATION_NOTIFICATION =
  'Company registration rejected';

export const getCompanyRejectedRegistrationTemplate = () => {
  const mjml = companyInviteNotificationLayout({
    body: template(),
  });

  return {
    template: mjml2html(mjml).html,
    subject: COMPANY_REJECTED_REGISTRATION_NOTIFICATION,
  };
};
