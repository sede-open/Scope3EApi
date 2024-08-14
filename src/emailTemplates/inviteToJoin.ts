import mjml2html from 'mjml';

interface TemplateProps {
  inviteeName: string;
  inviterName: string;
  inviterCompanyName: string;
  inviteLink: string;
}

const template = ({
  inviteeName,
  inviterName,
  inviterCompanyName,
  inviteLink,
}: TemplateProps) => `
  <mjml>
    <mj-head>
      <mj-title>Supplier Energy Transition Hub</mj-title>
      <mj-preview>Invitation to join notification</mj-preview>
      <mj-attributes>
        <mj-all font-family="Arial, sans-serif"></mj-all>
        <mj-text font-weight="400" font-size="16px" color="#000000" line-height="24px" font-family="Arial, sans-serif"></mj-text>
      </mj-attributes>
      <mj-style>
        .feature-icon-column {
          width: 75px !important;
        }

        .feature-description-column {
          width: calc(100% - 75px) !important;
        }

        .feature-icon img {
          width: 48px !important;
        }

        .feature-description-header {
          font-weight: bold;
          font-size: 14px;
          margin: 0;
        }

        .feature-description-paragraph {
          margin: 0 0 8px 0;
        }

        .paragraph {
          margin: 0;
        }

        .align-center {
          text-align: center;
        }

        .link {
          color: inherit;
        }
  
        .link:hover {
          color: inherit;
        }

        @media (min-width: 600px) {
          .feature-icon-column {
            width: 100px !important;
          }

          .feature-icon img {
            width: 64px !important;
          }

          .feature-icon-column {
            width: 100px !important;
          }

          .feature-description-column {
            width: calc(100% - 100px) !important;
          }
        }

      </mj-style>
    </mj-head>
    <mj-body background-color="#F7F7F7">
      <mj-wrapper padding="0" full-width="full-width">
        <mj-section
          padding-top="0"
          background-url="https://abcd.example.com/images/email/banner.jpg"
        >
          <mj-column css-class="main-column">
            <mj-image
              width="270px"
              src="https://abcd.example.com/images/email/logo.png"
              alt="Example Supplier Energy Transition Hub logo"
              align="left"
              padding-top="0"
              padding-left="48px"
            />
            <mj-spacer height="120px" />
          </mj-column>
        </mj-section>
      </mj-wrapper>

      <mj-wrapper padding="0" full-width="full-width" background-color="#F7F7F7">
        <mj-section
          full-width="full-width"
          padding="0"
          background-color="#ffffff"
        >
          <mj-column padding="0 22px">
            <mj-text
              css-class="main-header"
              color="#404040"
              font-weight="bold"
              font-size="18px"
              line-height="26px"
              padding-top="32px"
            >
              Hi ${inviteeName},
            </mj-text>
            <mj-text color="#404040" font-size="14px" line-height="26px">
              You’ve been invited by <b>${inviterName}</b> from
              <b>${inviterCompanyName}</b> to join the
              <a
                href="https://abcd.example.com"
                class="link"
                color="#404040"
              >
                Example Supplier Energy Transition Hub</a
              >
              to collaborate. Please click on the button below to set up your
              account.
            </mj-text>

            <mj-button
              border-radius="0px"
              background-color="#FBCE07"
              width="44%"
              align="center"
              color="#404040"
              font-size="14px"
              line-height="22px"
              font-weight="bold"
              href="${inviteLink}"
              padding="18px 0 0 0"
              inner-padding="16px"
            >
              Set up account
            </mj-button>
            <mj-text
              align="center"
              color="#595959"
              font-size="14px"
              line-height="26px"
              container-background-color="#ffffff"
              padding-bottom="24px"
            >
              Please note that this invitation is only valid for 14 days
            </mj-text>
            <mj-divider border-width="1px" border-color="#d9d9d9" />
          </mj-column>
        </mj-section>

        <mj-section padding="0" background-color="#ffffff">
          <mj-column padding="16px 22px">
            <mj-text
              color="#404040"
              font-size="14px"
              line-height="26px"
              container-background-color="#ffffff"
            >
              By <b>joining the Hub</b> you can: <br />
            </mj-text>
            <mj-text
              color="#404040"
              font-size="14px"
              line-height="26px"
              padding="0 0 0 32px"
              container-background-color="#ffffff"
            >
              • Access anonymous comparison of your corporate emissions.<br />
              • Learn about the solutions implemented by companies similar to
              yours.<br />
              • Compare your carbon intensity over time.<br />
              • Explore ways to achieve your emissions ambition.<br />
              • Request emissions data from your suppliers.<br />
              • Share your emissions data with your customers.
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section
          background-color="#ffffff"
          padding-top="0"
          padding-bottom="12px"
        >
          <mj-column padding="16px 22px">
            <mj-text color="#404040" font-size="14px" line-height="21px">
              <p class="paragraph">Welcome aboard,</p>
              <p class="paragraph">From the Hub team</p>
            </mj-text>
          </mj-column>
        </mj-section>

        <mj-section padding-top="12px" padding-bottom="0">
          <mj-column padding-bottom="0">
            <mj-text color="#404040" font-size="14px" line-height="21px">
              <p class="paragraph align-center">
                If you have any questions, please visit our
                <a class="link" href="https://abcd.example.com/">website</a>
                or
                <a class="link" href="https://abcd.example.com/get-in-touch"
                  >contact us</a
                >.
              </p>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-wrapper>
    </mj-body>
  </mjml>
`;

export const INVITE_TO_JOIN_EMAIL_SUBJECT =
  'Invitation to join Example Supplier Energy Transition Hub';

export const getInviteToJoinTemplate = ({
  inviteeName,
  inviterName,
  inviterCompanyName,
  inviteLink,
}: TemplateProps) => {
  const mjml = template({
    inviteeName,
    inviterName,
    inviterCompanyName,
    inviteLink,
  });

  return {
    template: mjml2html(mjml).html,
    subject: INVITE_TO_JOIN_EMAIL_SUBJECT,
  };
};
