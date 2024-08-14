import jwt from 'jsonwebtoken';
import { getConfig } from '../config';
import { CacheService } from '../services/CacheService';

import {
  TOKEN_USED_ERROR,
  TOKEN_USED_ERROR_CODE,
  validateInviteJWT,
} from './validateInviteJWT';

describe('validateInviteJWT', () => {
  const JWT_SECRET_1 = getConfig().jwt.inviteSigningSecret;
  const JWT_SECRET_2 = 'iamsecret2';
  const id = '66b212ca-20af-4075-a3a8-d1e6ca777ec6';
  const email = 'test@test.com';

  const validJWT = jwt.sign(
    {
      email,
      id,
    },
    JWT_SECRET_1,
    {
      issuer: getConfig().jwt.xyzIssuer,
    }
  );

  const invalidJWT = jwt.sign(
    {
      email,
      id,
    },
    JWT_SECRET_2,
    {
      issuer: getConfig().jwt.xyzIssuer,
    }
  );

  describe('when token cannot be verified', () => {
    it('should return false', async () => {
      const result = await validateInviteJWT(invalidJWT);
      expect(result).toBe(false);
    });
  });

  describe('when token is verified', () => {
    describe('when the token has already been used', () => {
      const cache = CacheService();

      beforeAll(async () => {
        await cache.initialise();
        await cache.set(id, validJWT);
      });

      afterAll(async () => {
        await cache.redis.del(id);
      });

      it('should throw an error', async () => {
        try {
          await validateInviteJWT(validJWT);
        } catch (err) {
          expect(err.message).toBe(TOKEN_USED_ERROR);
          expect(err.extensions.code).toBe(TOKEN_USED_ERROR_CODE);
        }
      });
    });

    describe('when the token has not been used yet', () => {
      it('should return true', async () => {
        const result = await validateInviteJWT(validJWT);
        expect(result).toBe(true);
      });
    });
  });
});
