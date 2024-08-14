import { createHash as cryptoCreateHash } from 'crypto';

export const createHash = (value: string) => {
  const hash = cryptoCreateHash('sha256');

  hash.update(value);
  return hash.digest('hex');
};
