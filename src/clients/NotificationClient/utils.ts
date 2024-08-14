import { getConfig } from '../../config';
import { UserEntity } from '../../entities/User';
import { JWTService } from '../../services/JWTService';

export const getInviteLink = (user: UserEntity) => {
  const {
    jwt: { inviteSigningSecret },
    webAppBaseUrl,
  } = getConfig();

  const jwtService = new JWTService();
  const token = jwtService.generateUserJWT({
    id: user.id,
    email: user.email,
    secret: inviteSigningSecret,
  });

  return `${webAppBaseUrl}/auth/invite?inviteToken=${token}`;
};
