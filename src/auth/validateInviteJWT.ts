import { ApolloError } from 'apollo-server-errors';
import { getConfig } from '../config';
import { JWTService } from '../services/JWTService';

export const TOKEN_USED_ERROR = 'Invitation token has already been used';
export const TOKEN_USED_ERROR_CODE = 'USED_INVITE_TOKEN';

export const validateInviteJWT = async (token: string) => {
  const jwtService = new JWTService();
  const {
    jwt: { inviteSigningSecret: secret },
  } = getConfig();

  const isTokenVerified = jwtService.verifyJWT({
    token,
    secret,
  });

  const hasTokenBeenUsed = await jwtService.checkUsedToken({
    token,
  });

  // NOTE :: custom error for when an invite token has been used
  // as UI handles it differently from invalid tokens
  if (hasTokenBeenUsed) {
    throw new ApolloError(TOKEN_USED_ERROR, TOKEN_USED_ERROR_CODE);
  }

  return isTokenVerified;
};
