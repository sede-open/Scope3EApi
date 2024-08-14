import { Tundora } from '../colours';

export const header = ({ title }: { title: string }) => `
  <mj-text
    align="center"
    color="${Tundora}"
    font-size="18px"
    font-weight="bold"
    padding="30px 0"
  >
    ${title}
  </mj-text>
`;
