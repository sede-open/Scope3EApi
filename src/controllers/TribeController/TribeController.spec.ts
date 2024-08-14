import { TribeController } from './';
import { IContext } from '../../apolloContext';

import { getConfig } from '../../config';

jest.mock('../../config');

describe('TribeController', () => {
  describe('getUsageStats()', () => {
    it('should return user stats', async () => {
      const controller = new TribeController();

      const result = await controller.getUsageStats(
        undefined,
        (jest.fn() as unknown) as IContext
      );

      expect(result.members).toEqual(69809);
      expect(result.topics).toEqual(500);
      expect(result.replies).toEqual(400);
    });
  });

  describe('getTribeJwt()', () => {
    const email = 'testgod@gmail.com';
    const firstName = 'Test';
    const lastName = 'God';
    const tribeSigningSecret = 'tribe-signing-secret';

    it('should pass the user details and secret to generate a tribe JWT', async () => {
      (getConfig as jest.Mock).mockReturnValue({
        jwt: { tribeSigningSecret },
      });
      const controller = new TribeController();

      const generateTribeJWT = jest.fn();

      await controller.getTribeJwt(undefined, ({
        services: { jwt: { generateTribeJWT } },
        user: {
          firstName,
          lastName,
          email,
        },
      } as unknown) as IContext);

      expect(generateTribeJWT).toHaveBeenCalledWith({
        email,
        name: `${firstName} ${lastName}`,
        secret: tribeSigningSecret,
      });
    });
  });
});
