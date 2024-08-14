import { Router, Response, NextFunction, Request } from 'express';
import escape from 'validator/lib/escape';

import { handleErrors } from '../middleware/handleErrors';
import { logger } from '../utils/logger';

import { mulesoft } from '../clients/MulesoftEmailClient';
import { JWTService } from '../services/JWTService';
import { InvalidArgumentError, InviteTokenInvalidError } from '../utils/errors';
import { rateLimiter } from '../middleware/rateLimiter';
import {
  isEveryInputSafe,
  isValidEmail,
  isValidEnquiry,
} from '../utils/validators';
import { EMAIL_ENQUIRIES } from '../utils/enquiries';
import { ContactEmailSource, EmailEnquiry } from '../types';
import { ENQUIRY_NOT_SENT } from '../utils/errorStrings';
import { getConfig, LAUNCH_DARKLY_GLOBAL_USER } from '../config';
import { CONTACT_EMAIL_SOURCE } from '../utils/sources';
import { getSecureHash } from '../clients/LaunchDarklyClient';

export const router = Router();

export interface ContactEmailBody {
  name: string;
  company: string;
  email: string;
  enquiry: string;
  message: string;
  commsConsent: boolean;
  termsConsent: boolean;
  source: string;
}

const sanitiseSource = (source: string) => {
  return escape(source).replace(/-/g, '_').toUpperCase();
};

export const getContactEmailBody = ({
  name,
  company,
  email,
  enquiry,
  message,
  commsConsent,
  termsConsent,
  source,
}: ContactEmailBody): string => `<p>You have received an enquiry from the Supply Energy Tranisition Hub website.</p>
  <ul>
    <li><b>Name</b>: ${name}</li>
    <li><b>Company</b>: ${company}</li>
    <li><b>Email</b>: ${email}</li>
    <li><b>Enquiry Type</b>: ${enquiry}</li>
    <li><b>Message</b>:<br/>${message}</li>
    <li><b>User has agreed to receiving marketing communications from Example Group</b>: ${
      commsConsent ? 'Yes' : 'No'
    }</li>
    <li><b>How did you hear from us?</b>: ${source}</li>
    <li><b>User has agreed to Terms and conditions</b>: ${
      termsConsent ? 'Yes' : 'No'
    }</li>
  </ul>`;

router.post(
  '/contact-email',
  [rateLimiter],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (
        !req.body.name ||
        !req.body.company ||
        !req.body.email ||
        !req.body.enquiry ||
        !isEveryInputSafe([
          req.body.name,
          req.body.message || '',
          req.body.company,
        ]) ||
        !isValidEmail(req.body.email) ||
        !isValidEnquiry(req.body.enquiry)
      ) {
        throw new InvalidArgumentError();
      }

      const sanitisedEmail = escape(req.body.email);
      const sanitisedName = escape(req.body.name);
      const sanitisedMessage = escape(req.body.message || '');
      const sanitisedCompany = escape(req.body.company);
      const sanitisedCommsConsent = Boolean(req.body.commsConsent);
      const sanitiseTermsConsent = Boolean(req.body.termsConsent);
      const sanitisedSource = sanitiseSource(req.body.source || '');
      // isValidEnquiry checks if the enquiry is part of the enum
      const enquiry = EMAIL_ENQUIRIES[req.body.enquiry as EmailEnquiry];
      const source = sanitisedSource
        ? CONTACT_EMAIL_SOURCE[sanitisedSource as ContactEmailSource]
        : '';

      const contactEmailBody = getContactEmailBody({
        name: sanitisedName,
        email: sanitisedEmail,
        message: sanitisedMessage,
        company: sanitisedCompany,
        commsConsent: sanitisedCommsConsent,
        termsConsent: sanitiseTermsConsent,
        enquiry,
        source,
      });

      try {
        const response = await mulesoft.sendEmail({
          recipient: process.env.XYZ_EMAIL_ADDRESS ?? '',
          subject: enquiry,
          body: contactEmailBody,
          from: req.body.email,
        });
        res.json(response);
      } catch (err) {
        logger.error(err);
        next(new Error(ENQUIRY_NOT_SENT));
      }
    } catch (err) {
      logger.error(err);
      next(err);
    }
  }
);

router.get('/ld-hash', async (req: Request, res: Response) => {
  const launchDarklyHash = await getSecureHash({
    key: LAUNCH_DARKLY_GLOBAL_USER,
  });
  return res.json({ launchDarklyHash });
});

router.get(
  '/verify-invite',
  [rateLimiter],
  async (req: Request, res: Response, next: NextFunction) => {
    const jwt = req.query.jwt as string;
    const {
      jwt: { inviteSigningSecret: secret },
    } = getConfig();

    try {
      if (!jwt) {
        throw new InvalidArgumentError();
      }

      const jwtService = new JWTService();
      const isJWTValid = jwtService.verifyJWT({
        token: jwt as string,
        secret,
      });

      if (isJWTValid) {
        // @TODO :: check if the token has been used already
        res.status(200);
        res.json({ isJWTValid });
      } else {
        throw new InviteTokenInvalidError();
      }
    } catch (err) {
      next(err);
    }
  }
);

router.use(handleErrors);
