export class DnBApiError extends Error {
  code: string;
  duns?: string;

  constructor(message: string, code: string, duns?: string) {
    super(message);
    this.duns = duns;
    this.name = 'DnBApiError';
    this.code = code;
  }
}
