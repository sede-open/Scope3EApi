import jwt from 'jsonwebtoken';
import { getConfig } from '../../config';

import { UserEntity } from '../../entities/User';
import { getInviteLink } from './utils';

describe('getInviteLink()', () => {
  const user = ({
    id: '12324343543',
    email: 'test@test.com',
  } as unknown) as UserEntity;

  it('should return an invite link based on the user', () => {
    const result = getInviteLink(user);
    expect(result).toContain('localhost:3000/auth/invite?inviteToken=');
  });

  it('should pass user id and email to generateUserJWT', () => {
    jest.spyOn(jwt, 'sign');

    getInviteLink(user);

    expect(jwt.sign).toHaveBeenCalledWith(
      {
        email: user.email,
        id: user.id,
      },
      getConfig().jwt.inviteSigningSecret,
      expect.any(Object)
    );
  });
});
