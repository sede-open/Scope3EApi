export interface Token {
  email?: string;
  upn?: string;
  mail?: string;
  exp: number;
}

export type AUTHToken = {
  token: string;
  exp: string;
};
