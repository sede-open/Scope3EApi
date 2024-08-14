import { Request, Response } from 'express';
import { authenticate } from './expressAuth';
import { authenticateUser } from '../auth';
import { UnauthenticatedError } from '../utils/errors';

jest.mock('../auth');

describe('expressAuth', () => {
  describe('authenticate', () => {
    it('should add the authenticated user to the request', async () => {
      const user = { firstName: 'Hello' };
      ((authenticateUser as unknown) as jest.Mock).mockResolvedValue({
        user,
      });
      const req = ({} as unknown) as Request;
      const res = ({} as unknown) as Response;
      const next = jest.fn();
      await authenticate(req, res, next);

      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should return the error thrown by authenticateUser', async () => {
      const userAuthError = new UnauthenticatedError();
      ((authenticateUser as unknown) as jest.Mock).mockRejectedValueOnce(
        userAuthError
      );
      const req = ({} as unknown) as Request;
      const res = ({} as unknown) as Response;
      const next = jest.fn();
      await authenticate(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith(userAuthError);
    });
  });
});
