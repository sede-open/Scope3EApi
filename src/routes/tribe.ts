import { Router, Response, NextFunction, Request } from 'express';

import { hasRole } from '../middleware/hasRole';
import { authenticate } from '../middleware/expressAuth';
import { RoleName } from '../types';

import { logger } from '../utils/logger';
import { handleErrors } from '../middleware/handleErrors';
import { getConfig } from '../config';
import { UnauthenticatedError } from '../utils/errors';
import { JWTService } from '../services/JWTService';

export const router = Router();

router.use(authenticate);

router.get(
  '/jwt',
  [hasRole([RoleName.SupplierViewer])],
  async (req: Request, res: Response, next: NextFunction) => {
    const jwtService = new JWTService();
    const {
      jwt: { tribeSigningSecret: secret },
    } = getConfig();

    if (!req.user) {
      throw new UnauthenticatedError();
    }

    try {
      const { email, firstName, lastName } = req.user;
      const name = `${firstName} ${lastName}`;

      res.status(200).send({
        token: jwtService.generateTribeJWT({
          email,
          name,
          secret,
        }),
      });
      res.end();
    } catch (err) {
      logger.error(err, 'Failed to generate Tribe JWT');
      next(err);
    }
  }
);

router.use(handleErrors);
