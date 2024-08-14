import { ApolloError } from 'apollo-server-express';
import fetch from 'node-fetch';
import {
  AkamaiUserAlreadyExistsError,
  AkamaiRegistrationError,
} from '../../utils/errors';
import { logger } from '../../utils/logger';

interface IAkamaiRegistrationResponse {
  error?:
    | 'invalid_argument'
    | 'invalid_form_fields'
    | 'missing_argument'
    | 'permission_error'
    | 'unexpected_error';
  error_description?: string;
  error_details?: {
    emailAddress?: string[];
    firstName?: string[];
    lastName?: string[];
  };
}

export const USER_EXISTS_ERROR_MESSAGE = 'Email address is already in use.';

export interface IUserToRegister {
  email: string;
  firstName: string;
  lastName: string;
}

export interface IUserProfileUpdate {
  emailAddress: string;
  firstName: string;
  lastName: string;
}

interface IAkamaiClient {
  register: (user: IUserToRegister) => Promise<void>;
  updateProfile: (
    userId: string,
    user: IUserProfileUpdate,
    accessToken: string
  ) => Promise<void>;
}

export class AkamaiClient implements IAkamaiClient {
  private profileUrl: string;
  private registerApiUrl: string;
  private resendInviteApiUrl: string;

  constructor(
    baseUrl: string,
    private registerApiClientId: string,
    private registerApiClientSecret: string
  ) {
    this.profileUrl = `${baseUrl}/idp/v1/account/profile`;
    this.registerApiUrl = `${baseUrl}/idp/v1/account/pre-register`;
    this.resendInviteApiUrl = `${baseUrl}/idp/v1/account/resend-verification`;
  }

  public async register(userToRegister: IUserToRegister) {
    const payload = this.toRegisterRequestBody(userToRegister);

    const response = await fetch(this.registerApiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          this.registerApiClientId + ':' + this.registerApiClientSecret
        ).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    const data: IAkamaiRegistrationResponse = await response.json();

    if (data?.error) {
      const requestId = 'unknown';

      if (
        data.error_details?.emailAddress &&
        data.error_details.emailAddress.indexOf(USER_EXISTS_ERROR_MESSAGE) !==
          -1
      ) {
        throw new AkamaiUserAlreadyExistsError(requestId);
      }

      logger.error(`Error registring Akamai User: ${JSON.stringify(data)}`);

      throw new AkamaiRegistrationError(
        data.error_description || 'unknown error',
        requestId
      );
    }
  }

  private toRegisterRequestBody = ({
    email,
    firstName,
    lastName,
  }: IUserToRegister) => ({
    profile_fields: {
      firstName,
      lastName,
      emailAddress: email.toLowerCase(),
      resourceAccessAPP: true,
    },
    client_id: this.registerApiClientId,
    locale: 'en-US',
    auth_type: 'email',
    scope: 'openid',
    grant_type: 'password',
    redirect_uri: process.env.AKAMAI_REGISTRATION_REDIRECT,
  });

  public async updateProfile(
    userId: string,
    profileFields: IUserProfileUpdate,
    accessToken: string
  ) {
    const payload = {
      client_id: this.registerApiClientId,
      profile_fields: profileFields,
      locale: 'en-US',
    };

    const response = await fetch(this.profileUrl, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const res = await response.json();

    if (res.error) {
      logger.error(
        {
          error: res.error,
          userId,
        },
        'Akamai update user failed'
      );
      throw new ApolloError(res.error);
    }
  }

  public async resendInvite(userEmail: string) {
    const payload = {
      client_id: this.registerApiClientId,
      redirect_uri: process.env.AKAMAI_REGISTRATION_REDIRECT,
      auth_type: 'email',
      user_id: userEmail,
      locale: 'en-US',
    };

    const response = await fetch(this.resendInviteApiUrl, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (json.error) {
      logger.error(
        {
          error: json.error,
        },
        'Akamai resend user invite failed'
      );
      throw new ApolloError(json.error);
    }
  }
}
