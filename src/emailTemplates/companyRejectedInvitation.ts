import mjml2html from 'mjml';
import { companyInviteNotificationLayout } from './layouts/companyInviteNotificationLayout';
import { Tundora } from './colours';

interface TemplateProps {
  companyName: string;
  inviteeName: string;
}

const template = ({ companyName, inviteeName }: TemplateProps) => `
  <mj-column width="100%">
    <mj-text align="center" color="${Tundora}" font-size="18px" font-weight="bold" line-height="26px" padding="48px 0 18px 0">
      We are unable to invite ${companyName} 
    </mj-text>
  </mj-column>
  <mj-column width="100%">
    <mj-text color="${Tundora}" font-size="14px" align="center" line-height="20px" padding="0 0 12px 0">
      We are currently unable to invite <b>${inviteeName}</b> from <b>${companyName}</b> to join the Hub. A member of our team will be in touch shortly to explore the next steps.
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

export const COMPANY_REJECTED_INVITATION_NOTIFICATION =
  'Company invitation rejected';

export const getCompanyRejectedInvitationTemplate = ({
  companyName,
  inviteeName,
}: TemplateProps) => {
  const mjml = companyInviteNotificationLayout({
    body: template({
      companyName,
      inviteeName,
    }),
  });

  return {
    template: mjml2html(mjml).html,
    subject: COMPANY_REJECTED_INVITATION_NOTIFICATION,
  };
};
