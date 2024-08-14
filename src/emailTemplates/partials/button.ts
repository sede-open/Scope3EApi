import { Supernova, Tundora } from '../colours';

export const button = ({
  text,
  ctaLink,
}: {
  text: string;
  ctaLink: string;
}) => `
  <mj-button
    border-radius="0px"
    background-color="${Supernova}"
    align="center"
    color="${Tundora}"
    font-size="14px"
    font-weight="bold"
    href="${ctaLink}"
    width="175px"
    padding="30px 0 45px 0"
  >
    ${text}
  </mj-button>
`;
