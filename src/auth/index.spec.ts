import { Request } from 'express';
import { getMockReq } from '@jest-mock/express';
import { authenticateUser } from '.';
import { decodeToken } from './decodeToken';
import { getAccessTokenFromRequest } from './getAccessTokenFromRequest';
import { getOrCreateDBConnection } from '../dbConnection';
import { verifyAkamaiToken } from './verifyAkamaiToken';
import { verifyAUTHToken } from './verifyAUTHToken';
import { AuthProvider } from '../types';
import { adminUserMock } from '../mocks/user';
import { Environment } from '../utils/environment';
import { AccessDeniedError } from '../utils/errors';
import { AuthenticationError } from 'apollo-server-express';

jest.mock('./decodeToken');
jest.mock('../dbConnection');
jest.mock('./getAccessTokenFromRequest');
jest.mock('./verifyAkamaiToken');
jest.mock('./verifyAUTHToken');

describe(authenticateUser.name, () => {
  const token = 'IAMTOKEN';

  describe.each`
    env
    ${Environment.LOCAL}
    ${Environment.DEV}
    ${Environment.STAGING}
    ${Environment.PREPROD}
    ${Environment.PROD}
  `('when app is running in $env environment', ({ env }: { env: string }) => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      process.env = { ...OLD_ENV };
      process.env.ENVIRONMENT = env;
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });
    (getAccessTokenFromRequest as jest.Mock).mockReturnValue('');

    describe('when user is a Example user', () => {
      beforeAll(() => {
        // @TODO :: check if access token has email as the field
        (decodeToken as jest.Mock).mockReturnValue({
          email: 'john.smith@example.com',
        });
      });

      it('should return an authenticated user', async () => {
        const mockFindUser = jest.fn(() => adminUserMock);
        ((getOrCreateDBConnection as unknown) as jest.Mock).mockImplementation(
          () => ({
            getRepository: jest.fn(() => ({
              findOne: mockFindUser,
            })),
          })
        );

        (verifyAUTHToken as jest.Mock).mockResolvedValue(true);

        const req = ({
          headers: {
            authorization: `Bearer ${token}`,
            ['x-token-issuer']: AuthProvider.Port,
          },
        } as unknown) as Request;

        const actual = await authenticateUser(req);

        expect(actual.user).toEqual(adminUserMock);
        expect(actual.token).toEqual(token);
      });

      it('should not allow disabled users', async () => {
        ((getOrCreateDBConnection as unknown) as jest.Mock).mockImplementation(
          () => ({
            getRepository: jest.fn(() => ({
              findOne: jest.fn(() => undefined),
            })),
          })
        );

        (verifyAUTHToken as jest.Mock).mockResolvedValue(true);

        const req = ({
          headers: {
            authorization: `Bearer ${token}`,
            ['x-token-issuer']: AuthProvider.Port,
          },
        } as unknown) as Request;

        await expect(authenticateUser(req)).rejects.toThrow(
          new AccessDeniedError()
        );
      });
    });
  });

  it('should not allow Akamai users when access token is undefined', async () => {
    ((getOrCreateDBConnection as unknown) as jest.Mock).mockImplementation(
      () => true
    );

    const req = getMockReq({
      headers: {
        ['x-token-issuer']: AuthProvider.Akamai,
        ['x-access-token']: 'some-akamai-token',
      },
    });

    (verifyAkamaiToken as jest.Mock).mockResolvedValue(true);
    (decodeToken as jest.Mock).mockReturnValue({
      email: 'john.smith@example.com',
    });
    (getAccessTokenFromRequest as jest.Mock).mockReturnValue('');

    expect(authenticateUser(req)).rejects.toThrow(
      new AuthenticationError('You are not authenticated')
    );
  });
});
