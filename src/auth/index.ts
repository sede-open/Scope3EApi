import { ApolloError, AuthenticationError } from 'apollo-server-express';
import { Request } from 'express';
import { ContextUser, UserEntity } from '../entities/User';
import { getIssuerFromRequest } from './getIssuerFromRequest';
import { getTokenFromRequest } from './getTokenFromRequest';
import { getAccessTokenFromRequest } from './getAccessTokenFromRequest';
import { verifyAkamaiToken } from './verifyAkamaiToken';
import { decodeToken } from './decodeToken';
import { AccessDeniedError } from '../utils/errors';
import { AuthProvider } from '../types';
import { getOrCreateDBConnection } from '../dbConnection';
import { validateInviteJWT } from './validateInviteJWT';
import { Token } from './types';
import { verifyAUTHToken } from './verifyAUTHToken';

async function getDecodedTokenFromRequest(req: Request) {
  const issuer = getIssuerFromRequest(req);
  const token = getTokenFromRequest(req);
  const accessToken = getAccessTokenFromRequest(req);

  if (issuer === AuthProvider.Port && (await verifyAUTHToken(token))) {
    return { decoded: decodeToken<Token>(token), token };
  }

  if (issuer === AuthProvider.Akamai && (await verifyAkamaiToken(token))) {
    return { decoded: decodeToken<Token>(token), token, accessToken };
  }

  if (issuer === AuthProvider.Invite && (await validateInviteJWT(token))) {
    return { decoded: decodeToken<Token>(token), token };
  }

  return { token };
}

export async function authenticateUser(
  req: Request
): Promise<{
  user: ContextUser | undefined;
  token: string;
  accessToken?: string;
}> {
  const connection = await getOrCreateDBConnection();

  if (!connection) {
    throw new ApolloError('Could not establish DB connection');
  }

  const { decoded, token, accessToken } = await getDecodedTokenFromRequest(req);

  // This is checked in authMiddleware in the client app
  // it's checked here as well to avoid coupling and not to rely on the client
  const hasNoAccessToken =
    getIssuerFromRequest(req) === AuthProvider.Akamai && !accessToken;

  if (!decoded || hasNoAccessToken) {
    throw new AuthenticationError('You are not authenticated');
  }

  const email = (
    decoded.email ??
    decoded.upn ??
    decoded.mail ??
    ''
  ).toLocaleLowerCase();

  const user = (await connection.getRepository(UserEntity).findOne({
    where: { email },
    relations: ['company', 'roles'],
  })) as ContextUser;

  if (!user || !user.id) {
    throw new AccessDeniedError();
  }

  return { user, token, accessToken };
}
