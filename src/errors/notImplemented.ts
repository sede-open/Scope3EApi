export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message + ' not implemented');
    this.name = 'NotImplementedError';
  }
}
