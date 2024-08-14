import fetch from 'node-fetch';
import { AkamaiClient } from '.';
import {
  AkamaiRegistrationError,
  AkamaiUserAlreadyExistsError,
} from '../../utils/errors';
import { ApolloError } from 'apollo-server-express';

jest.mock('node-fetch');

describe('AkamaiClient', () => {
  const baseUrl = 'http://base-url';
  const accessToken = 'ACCESS_TOKEN';
  const clientId = 'SOME_CLIENT_ID';
  const clientSecret = 'SOME_CLIENT_SECRET';

  const user = {
    firstName: 'Test',
    lastName: 'McTest',
    email: 'test@test.com',
  };

  const akamaiClient = new AkamaiClient(baseUrl, clientId, clientSecret);

  describe('register', () => {
    const registrationUrl = `${baseUrl}/idp/v1/account/pre-register`;
    it('should register users in Akamai', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(undefined),
      });

      await akamaiClient.register(user);

      expect(fetch).toHaveBeenCalledWith(registrationUrl, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          Accept: 'application/json',
          Authorization: expect.any(String),
        },
        body: JSON.stringify({
          profile_fields: {
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.email,
            resourceAccessAPP: true,
          },
          client_id: clientId,
          locale: 'en-US',
          auth_type: 'email',
          scope: 'openid',
          grant_type: 'password',
          redirect_uri: process.env.AKAMAI_REGISTRATION_REDIRECT,
        }),
      });
    });

    it('should lowercase email addresses sent to Akamai', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(undefined),
      });

      process.env.AKAMAI_REGISTRATION_REDIRECT = 'http://redirect.url';

      const userWithCapitalizedEmail = {
        email: 'Harry.Windsor@SussexRoyal.com',
        firstName: 'Harry',
        lastName: 'Windsor',
      };

      await akamaiClient.register(userWithCapitalizedEmail);

      expect(fetch).toHaveBeenCalledWith(registrationUrl, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          Accept: 'application/json',
          Authorization: expect.any(String),
        },
        body: JSON.stringify({
          profile_fields: {
            firstName: userWithCapitalizedEmail.firstName,
            lastName: userWithCapitalizedEmail.lastName,
            emailAddress: userWithCapitalizedEmail.email.toLowerCase(),
            resourceAccessAPP: true,
          },
          client_id: clientId,
          locale: 'en-US',
          auth_type: 'email',
          scope: 'openid',
          grant_type: 'password',
          redirect_uri: process.env.AKAMAI_REGISTRATION_REDIRECT,
        }),
      });
    });

    it('should throw an error if there is a network error whilst registering', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Network error',
        json: jest.fn().mockResolvedValue({ error: 'Some error' }),
      });

      expect(akamaiClient.register(user)).rejects.toThrow(
        AkamaiRegistrationError
      );
    });

    it('should throw an error if Akamai already has a registered account for the provided email address', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: 'Some of the inputs are invalid',
          error_details: {
            emailAddress: ['Email address is already in use.'],
          },
        }),
      });

      expect(akamaiClient.register(user)).rejects.toThrow(
        AkamaiUserAlreadyExistsError
      );
    });

    it('should throw an error if Akamai does not return a success status', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          error: 'missing_argument',
        }),
      });

      expect(akamaiClient.register(user)).rejects.toThrow(
        AkamaiRegistrationError
      );
    });
  });

  describe('updateProfile', () => {
    const profileUrl = `${baseUrl}/idp/v1/account/profile`;

    const updateProfileFields = {
      emailAddress: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    beforeEach(() => {
      ((fetch as unknown) as jest.Mock).mockClear();
    });

    it('should throw an error if Akamai returns an error', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          error: 'invalid_argument',
        }),
      });

      expect(
        akamaiClient.updateProfile(
          'user-id',
          updateProfileFields,
          'ACCESS_TOKEN'
        )
      ).rejects.toThrow(ApolloError);
    });

    it('should update the user in Akamai', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ error: null }),
      });

      await akamaiClient.updateProfile(
        'user-id',
        updateProfileFields,
        accessToken
      );

      expect(fetch).toHaveBeenCalledWith(profileUrl, {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          profile_fields: updateProfileFields,
          locale: 'en-US',
        }),
      });
    });
  });

  describe('resendInvite', () => {
    const resendInviteUrl = `${baseUrl}/idp/v1/account/resend-verification`;

    beforeEach(() => {
      ((fetch as unknown) as jest.Mock).mockClear();
    });

    it('should throw an error if Akamai returns an error', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          error: 'invalid_argument',
        }),
      });

      expect(akamaiClient.resendInvite(user.email)).rejects.toThrow(
        ApolloError
      );
    });

    it('should update the user in Akamai', async () => {
      ((fetch as unknown) as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ error: null }),
      });

      await akamaiClient.resendInvite(user.email);

      expect(fetch).toHaveBeenCalledWith(resendInviteUrl, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: process.env.AKAMAI_REGISTRATION_REDIRECT,
          auth_type: 'email',
          user_id: user.email,
          locale: 'en-US',
        }),
      });
    });
  });
});
