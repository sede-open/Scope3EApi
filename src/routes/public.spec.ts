import request from 'supertest';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

import { startServer } from '../server';

import {
  EMAIL_SEND_SUCCESS_RESPONSE,
  mulesoft,
} from '../clients/MulesoftEmailClient';
import * as publicUtils from './public';
import { ContactEmailSource, EmailEnquiry } from '../types';
import { EMAIL_ENQUIRIES } from '../utils/enquiries';
import { getConfig } from '../config';
import { CONTACT_EMAIL_SOURCE } from '../utils/sources';
import { rateLimiterCache } from '../middleware/rateLimiter';

jest.mock('../clients/MulesoftEmailClient');

describe('public', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/contact-email', () => {
    let server: Server;

    const contactEmail: publicUtils.ContactEmailBody = {
      name: 'Test Person',
      company: 'Test company',
      email: 'test.person@hello.ok',
      enquiry: EmailEnquiry.Hydrogen,
      message: 'Hola',
      commsConsent: true,
      termsConsent: true,
      source: ContactEmailSource.Recommended,
    };

    const expectedContactEmailEnquiry = EMAIL_ENQUIRIES[EmailEnquiry.Hydrogen];

    const expectedContactEmailBody = {
      ...contactEmail,
      enquiry: expectedContactEmailEnquiry,
      source: CONTACT_EMAIL_SOURCE.RECOMMENDED,
    };

    beforeEach(async () => {
      server = await startServer();
      mulesoft.sendEmail = jest.fn();
      ((mulesoft.sendEmail as unknown) as jest.Mock).mockImplementation(
        () => EMAIL_SEND_SUCCESS_RESPONSE
      );
    });

    afterEach(async () => {
      jest.clearAllMocks();
      server.close();
      await rateLimiterCache.redis.flushall();
    });

    describe('when all required fields are provided', () => {
      it('should send a contact email', (done) => {
        expect.assertions(2);

        request(server)
          .post('/public/contact-email')
          .send(contactEmail)
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(mulesoft.sendEmail).toHaveBeenCalledWith(
              expect.objectContaining({
                from: expectedContactEmailBody.email,
                subject: expectedContactEmailEnquiry,
                body: publicUtils.getContactEmailBody(expectedContactEmailBody),
              })
            );
            expect(res.body).toEqual(EMAIL_SEND_SUCCESS_RESPONSE);
            return done();
          });
      });
    });

    describe('when rate limit of 10 is reached', () => {
      it('should respond with an 429 error', async () => {
        const requestMock = async (isRateLimited: boolean): Promise<unknown> =>
          request(server)
            .post('/public/contact-email')
            .send(contactEmail)
            .set('Remote-Addr', '192.168.2.1')
            .set('X-Forwarded-For', '192.168.2.1')
            .set('Accept', 'application/json')
            .expect(isRateLimited ? 429 : 200);

        await Promise.all([
          requestMock(false),
          requestMock(false),
          requestMock(false),
          requestMock(false),
          requestMock(false),
          requestMock(false),
          requestMock(false),
          requestMock(false),
          requestMock(false),
          requestMock(false),
        ]);

        await requestMock(true); // 11 should return 429
      });
    });

    describe('when required fields are NOT provided', () => {
      it('should return an error', (done) => {
        mulesoft.sendEmail = jest.fn();

        request(server)
          .post('/public/contact-email')
          .set('Remote-Addr', '192.168.2.2')
          .set('X-Forwarded-For', '192.168.2.2')
          .send()
          .set('Accept', 'application/json')
          .expect(422, done);
      });
    });

    describe.each`
      override                                      | description
      ${{ enquiry: 'Forbidden <a>characters</a>' }} | ${'subject contains forbidden characters'}
      ${{ message: 'Forbidden <a>characters</a>' }} | ${'message contains forbidden characters'}
      ${{ email: 'not.an.email.addres' }}           | ${'email address is not valid'}
    `(
      'when $description',
      ({ override }: { override: Partial<publicUtils.ContactEmailBody> }) => {
        it('should throw an error', (done) => {
          mulesoft.sendEmail = jest.fn();

          request(server)
            .post('/public/contact-email')
            .send({
              ...contactEmail,
              ...override,
            })
            .set('Accept', 'application/json')
            .expect(422)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(mulesoft.sendEmail).not.toHaveBeenCalled();
              expect(res.body.message).toEqual('Provided payload is not valid');
              return done();
            });
        });
      }
    );

    const textWithDangarousCharacters = '<svg/ onload="https://test.com"';
    const sanitisedText =
      '&lt;svg&#x2F; onload=&quot;https:&#x2F;&#x2F;test.com&quot;';

    describe.each`
      override
      ${'message'}
      ${'company'}
      ${'name'}
    `(
      'when $override input contains dangerous characters',
      ({ override }: { override: string }) => {
        it('should sanitise that input', (done) => {
          mulesoft.sendEmail = jest.fn();
          jest.spyOn(publicUtils, 'getContactEmailBody');

          request(server)
            .post('/public/contact-email')
            .send({
              ...contactEmail,
              [override]: textWithDangarousCharacters,
            })
            .set('Accept', 'application/json')
            .expect(200)
            .end((err) => {
              if (err) {
                return done(err);
              }

              expect(publicUtils.getContactEmailBody).toHaveBeenCalledWith({
                ...expectedContactEmailBody,
                [override]: sanitisedText,
              });

              return done();
            });
        });
      }
    );
  });

  describe('/verify-invite', () => {
    let server: Server;
    const id = '66b212ca-20af-4075-a3a8-d1e6ca777ec6';
    const email = 'test@test.com';
    const {
      jwt: { inviteSigningSecret, xyzIssuer },
    } = getConfig();

    beforeEach(async () => {
      server = await startServer();
    });

    afterEach(async () => {
      jest.clearAllMocks();
      server.close();
      await rateLimiterCache.redis.flushall();
    });

    describe('when a valid jwt token is given', () => {
      it('should respond with true', (done) => {
        expect.assertions(1);

        const validJWT = jwt.sign(
          {
            email,
            id,
          },
          inviteSigningSecret,
          {
            issuer: xyzIssuer,
          }
        );

        request(server)
          .get(`/public/verify-invite?jwt=${validJWT}`)
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            console.log('err', err);
            if (err) {
              return done(err);
            }
            expect(res.body).toEqual({ isJWTValid: true });
            return done();
          });
      });
    });

    describe('when a jwt with an invalid signature is given', () => {
      it('should throw an error', (done) => {
        const invalidJWT = jwt.sign(
          {
            email,
            id,
          },
          'invalid_secret',
          {
            issuer: process.env.JWT_ISSUER,
          }
        );

        request(server)
          .get(`/public/verify-invite?jwt=${invalidJWT}`)
          .set('Accept', 'application/json')
          .expect(401)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body.message).toEqual('Invite token is not valid');
            return done();
          });
      });
    });

    describe('when an expired jwt is given', () => {
      it('should throw an error', (done) => {
        const invalidJWT = jwt.sign(
          {
            email,
            id,
          },
          process.env.INVITE_JWT_SECRET!,
          {
            issuer: process.env.JWT_ISSUER,
            expiresIn: '0s',
          }
        );

        request(server)
          .get(`/public/verify-invite?jwt=${invalidJWT}`)
          .set('Accept', 'application/json')
          .expect(401)
          .end((_, res) => {
            expect(res.body.message).toEqual('Invite token is not valid');
            return done();
          });
      });
    });
  });
});
