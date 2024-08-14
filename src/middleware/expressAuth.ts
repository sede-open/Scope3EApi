import { NextFunction, Request, Response } from 'express';
import { authenticateUser } from '../auth';
import { UnauthenticatedError } from '../utils/errors';

export const authenticate = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    // if user can't be authenticated, authenticateUser() will throw an error
    const { user } = await authenticateUser(req);
    req.user = user;
    next();
  } catch (err) {
    next(new UnauthenticatedError());
  }
};
