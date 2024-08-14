import { NextFunction, Response, Request } from 'express';
import { RoleName } from '../types';
import { UnauthenticatedError, UnauthorisedError } from '../utils/errors';

export const hasRole = (roles: RoleName[]) => (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user?.roles?.length) {
      throw new UnauthenticatedError();
    }
    const userRoles = user.roles.map((role) => role.name);

    let userHasRequiredRole = false;

    userRoles.forEach((role) => {
      if (roles.includes(role)) {
        userHasRequiredRole = true;
      }
    });

    if (!userHasRequiredRole) {
      throw new UnauthorisedError();
    }

    next();
  } catch (err) {
    next(err);
  }
};
