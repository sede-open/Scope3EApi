import { getMockReq } from '@jest-mock/express';
import { getIssuerFromRequest } from './getIssuerFromRequest';

describe('getIssuerFromRequest', () => {
  it('should retrieve the token_issuer header from an express request', () => {
    const req = getMockReq({
      cookies: { some_cookie: 'SomeValue' },
      headers: { 'x-token-issuer': 'PORT' },
    });
    const expected = 'PORT';

    const actual = getIssuerFromRequest(req);

    expect(actual).toEqual(expected);
  });

  it('should fallback by returning the token_issuer cookie from an express request', () => {
    const req = getMockReq({
      cookies: { token_issuer: 'AKAMAI' },
      headers: {},
    });
    const expected = 'AKAMAI';

    const actual = getIssuerFromRequest(req);

    expect(actual).toEqual(expected);
  });
});
