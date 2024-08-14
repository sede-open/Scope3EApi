import { WildSand, White, Gray } from '../colours';

export const notificationLayout = ({ body }: { body: string }) => `
  <mjml>
    <mj-head>
      <mj-attributes>
        <mj-all font-family="Arial, serif"></mj-all>
      </mj-attributes>
      <mj-style inline="inline">
        .text-link { color: inherit }
      </mj-style>
      <mj-style inline="inline">
        .non-link { color: inherit; text-decoration: none }
      </mj-style>
    </mj-head>
    <mj-body background-color="${WildSand}" width="600px">
      <mj-wrapper padding-top="0" padding-bottom="0">
        <mj-section>
          <mj-column width="100%">
            <mj-image
              align="left"
              padding="10px 0px"
              src="https://abcd.example.com/images/email/notification_logo.png"
              width="361px">
            </mj-image>
          </mj-column>
        </mj-section>
        <mj-section background-color="${White}" padding-left="15px" padding-right="15px">
          <mj-column width="100%">
            ${body}
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column width="100%">
            <mj-text color="${Gray}" font-size="12px" align="center" margin-bottom="0" padding-bottom="0">
              Powered by
            </mj-text>

            <mj-text font-size="12px" color="${Gray}" align="center">
              <a class="text-link" href="https://abcd.example.com" target="_blank">
                Supplier Energy Transition Hub
              </a>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-wrapper>
    </mj-body>
  </mjml>
`;
