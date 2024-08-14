import jwt from 'jsonwebtoken';
import { getConfig } from '../../config';
import { getSecondsInNumberOfDays } from '../../utils/datetime';
import { JWTService } from '.';

describe('JWTService', () => {
  const JWT_SECRET_1 = 'iamsecret';
  const JWT_SECRET_2 = 'iamsecret2';
  const id = '66b212ca-20af-4075-a3a8-d1e6ca777ec6';
  const email = 'test@test.com';
  const service = new JWTService();

  describe('generateJWT()', () => {
    it('will encode user details', () => {
      const result = service.generateUserJWT({
        id,
        email,
        secret: JWT_SECRET_1,
      });

      expect(result).not.toBeUndefined();

      const decoded = jwt.verify(result, JWT_SECRET_1);
      expect(decoded).toEqual(
        expect.objectContaining({
          id,
          email,
        })
      );
    });

    it('should set 14 day expiry period by default', () => {
      const result = service.generateUserJWT({
        id,
        email,
        secret: JWT_SECRET_1,
      });
      const decoded = (jwt.verify(result, JWT_SECRET_1) as unknown) as {
        iat: number;
        exp: number;
      };

      const expiryPeriod = decoded.exp - decoded.iat;
      const forteenDaysInSeconds = 60 * 60 * 24 * 14;

      expect(expiryPeriod).toBe(forteenDaysInSeconds);
    });

    it('should allow setting custom expiry period', () => {
      const result = service.generateUserJWT({
        id,
        email,
        secret: JWT_SECRET_1,
        expiresIn: '7d',
      });
      const decoded = (jwt.verify(result, JWT_SECRET_1) as unknown) as {
        iat: number;
        exp: number;
      };

      const expiryPeriod = decoded.exp - decoded.iat;
      const sevenDaysInSeconds = 60 * 60 * 24 * 7;

      expect(expiryPeriod).toBe(sevenDaysInSeconds);
    });
  });

  describe('validateJWT', () => {
    const validJWT = jwt.sign(
      {
        email,
        id,
      },
      JWT_SECRET_1,
      {
        issuer: process.env.JWT_ISSUER,
      }
    );

    const invalidJWT = jwt.sign(
      {
        email,
        id,
      },
      JWT_SECRET_2,
      {
        issuer: process.env.JWT_ISSUER,
      }
    );

    const expiredJWT = jwt.sign(
      {
        email,
        id,
      },
      JWT_SECRET_1,
      {
        issuer: process.env.JWT_ISSUER,
        expiresIn: '0s',
      }
    );

    it('should return true when a valid JWT is provided', () => {
      const result = service.verifyJWT({
        token: validJWT,
        secret: JWT_SECRET_1,
      });

      expect(result).toBe(true);
    });

    it('should return false when a JWT with an invalid signature is provided', () => {
      const result = service.verifyJWT({
        token: invalidJWT,
        secret: JWT_SECRET_1,
      });

      expect(result).toBe(false);
    });

    it('should return false when an expired JWT is provided', () => {
      const result = service.verifyJWT({
        token: expiredJWT,
        secret: JWT_SECRET_1,
      });

      expect(result).toBe(false);
    });
  });

  describe('generateTribeJWT', () => {
    const tribeSigningSecret = 'tribe-signing-secret';
    const email = 'matt@gmail.com';
    const name = 'Matt B';
    const now = new Date('2022-06-28T16:00:00.000Z');

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(now);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should call sign with the appropriate params', () => {
      const token = service.generateTribeJWT({
        email,
        name,
        secret: tribeSigningSecret,
      });

      const decoded = (jwt.verify(token, tribeSigningSecret) as unknown) as {
        iat: number;
        exp: number;
        sub: string;
        email: string;
        iss: string;
      };

      expect(decoded).toEqual({
        sub: 'matt@gmail.com',
        email: 'matt@gmail.com',
        name: 'Matt B',
        iat: Math.round(now.getTime() / 1000),
        exp: Math.round(now.getTime() / 1000) + getSecondsInNumberOfDays(14),
        iss: getConfig().jwt.xyzIssuer,
      });
    });
  });
});
