import crypto from 'crypto';
import { createHash } from './hash';

jest.mock('crypto');

describe('hash', () => {
  describe('createHash()', () => {
    it('should call crypto library with the right values', () => {
      const valueToHash = 'test';
      const expectedHash = 'hg3h21g3h1232vg';
      const updateMock = jest.fn();
      const digestMock = jest.fn().mockReturnValue(expectedHash);
      ((crypto.createHash as unknown) as jest.Mock).mockImplementation(() => ({
        update: updateMock,
        digest: digestMock,
      }));

      const res = createHash('test');

      expect(crypto.createHash).toBeCalledTimes(1);
      expect(updateMock).toBeCalledTimes(1);
      expect(updateMock).toBeCalledWith(valueToHash);
      expect(digestMock).toBeCalledTimes(1);
      expect(res).toBe(expectedHash);
    });
  });
});
