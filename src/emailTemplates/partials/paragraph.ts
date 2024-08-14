import { Scorpion } from '../colours';

export const paragraph = ({ text }: { text: string }) => `
  <mj-text color="${Scorpion}" font-size="16px" align="center" line-height="20px">
    ${text}
  </mj-text>
`;
