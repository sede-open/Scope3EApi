import { getConfig } from '../../config';
import { TribeUsageStats, TribeJwt } from '../../types';
import { ControllerFunctionAsync } from '../types';

export class TribeController {
  getUsageStats: ControllerFunctionAsync<
    undefined,
    TribeUsageStats
  > = async () => {
    return {
      topics: 500,
      replies: 400,
      members: 69809,
    };
  };

  getTribeJwt: ControllerFunctionAsync<undefined, TribeJwt> = async (
    _,
    context
  ) => {
    const {
      jwt: { tribeSigningSecret: secret },
    } = getConfig();
    const { email, firstName, lastName } = context.user;
    const name = `${firstName} ${lastName}`;

    return {
      token: context.services.jwt.generateTribeJWT({
        email,
        name,
        secret,
      }),
    };
  };
}
