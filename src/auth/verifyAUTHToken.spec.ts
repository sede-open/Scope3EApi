import fetch from 'node-fetch';

jest.mock('node-fetch');

import { verifyAUTHToken } from './verifyAUTHToken';

describe(verifyAUTHToken.name, () => {
  const token = 'IAMTOKEN';
  const clientId = process.env.AUTH_CLIENT_ID;
  const invalidClientId = 'INVALID_CLIENT_ID';

  describe('when token validation call is successful', () => {
    describe('when response payload contains matching client id', () => {
      it('should return true', async () => {
        ((fetch as unknown) as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ client_id: clientId }),
        });

        const result = await verifyAUTHToken(token);

        expect(result).toBe(true);
      });
    });

    describe('when response payload does not contain matching client id', () => {
      it('should return false', async () => {
        ((fetch as unknown) as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ client_id: invalidClientId }),
        });

        const result = await verifyAUTHToken(token);

        expect(result).toBe(false);
      });
    });
  });

  describe('when token validation call is unsuccessful', () => {
    it('should return false', async () => {
      ((fetch as unknown) as jest.Mock).mockRejectedValueOnce(
        new Error('Oops')
      );

      const result = await verifyAUTHToken(token);

      expect(result).toBe(false);
    });
  });
});
