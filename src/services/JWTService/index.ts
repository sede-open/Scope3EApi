import { ApolloError } from 'apollo-server-errors';
import jwt from 'jsonwebtoken';
import { Token } from '../../auth/types';
import { getConfig } from '../../config';

import { DEFAULT_JWT_EXPIRY_PERIOD } from '../../constants/jwt';
import { getSecondsInNumberOfDays } from '../../utils/datetime';
import { logger } from '../../utils/logger';
import { CacheService } from '../CacheService';

const TOKEN_GET_ERROR = 'Could not retrieve token';
const TOKEN_INVALID_ERROR = 'Token is invalid';

interface IGenerateTribeJWT {
  email: string;
  name: string;
  secret: string;
  expireInDays?: number;
}

export class JWTService {
  public generateUserJWT({
    email,
    id,
    secret,
    expiresIn = DEFAULT_JWT_EXPIRY_PERIOD,
  }: {
    email: string;
    id: string;
    secret: string;
    expiresIn?: string | number;
  }) {
    const {
      jwt: { xyzIssuer },
    } = getConfig();

    return jwt.sign(
      {
        email,
        id,
      },
      secret,
      {
        expiresIn,
        issuer: xyzIssuer,
      }
    );
  }

  public verifyJWT({ token, secret }: { token: string; secret: string }) {
    const {
      jwt: { xyzIssuer },
    } = getConfig();

    try {
      const decoded = jwt.verify(token, secret, {
        issuer: xyzIssuer,
        ignoreExpiration: false,
      });

      if (decoded) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  public async saveUsedToken({
    token,
    userId,
  }: {
    token: string;
    userId: string;
  }) {
    const cache = CacheService();
    await cache.initialise();
    try {
      const currentTime = new Date().getTime() / 1000;
      const decoded = jwt.decode(token) as Token | null;
      const expiresIn = Math.round((decoded?.exp ?? 0) - currentTime);

      if (expiresIn > 0) {
        await cache.set(userId, token, 'EX', expiresIn);
      }
    } catch (err) {
      logger.error(err);
    }
  }

  public async checkUsedToken({ token }: { token: string }) {
    const cache = CacheService();
    await cache.initialise();

    const decoded = jwt.decode(token) as { id: string } | null;

    if (!decoded?.id) {
      throw new ApolloError(TOKEN_INVALID_ERROR);
    }

    try {
      return (await cache.get(decoded.id)) === token;
    } catch (err) {
      logger.error(err);
      throw new ApolloError(TOKEN_GET_ERROR);
    }
  }

  public generateTribeJWT({
    email,
    name,
    secret,
    expireInDays = 14,
  }: IGenerateTribeJWT) {
    const {
      jwt: { xyzIssuer },
    } = getConfig();

    const now = Math.round(new Date().getTime() / 1000);

    const userData = {
      sub: email, // A unique identifier by which to track the user in Tribe
      email,
      name,
      iat: now, // token issue time
      exp: now + getSecondsInNumberOfDays(expireInDays), // token expiration time
    };

    return jwt.sign(userData, secret, {
      algorithm: 'HS256',
      issuer: xyzIssuer,
    });
  }
}
