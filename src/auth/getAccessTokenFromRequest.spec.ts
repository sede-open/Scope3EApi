import { getMockReq } from '@jest-mock/express';
import { getAccessTokenFromRequest } from './getAccessTokenFromRequest';

describe('getAccessTokenFromRequest', () => {
  it('should retrieve the x-access-token header from an express request', () => {
    const accessToken = 'ACCESS_TOKEN';
    const req = getMockReq({
      cookies: { some_cookie: 'SomeValue' },
      headers: { 'x-access-token': accessToken },
    });

    const actual = getAccessTokenFromRequest(req);

    expect(actual).toEqual(accessToken);
  });

  it('should fallback by returning the access-token cookie from an express request', () => {
    const accessToken = 'ACCESS_TOKEN';
    const req = getMockReq({
      cookies: { access_token: accessToken },
      headers: {},
    });
    const expected = 'ACCESS_TOKEN';

    const actual = getAccessTokenFromRequest(req);

    expect(actual).toEqual(expected);
  });
});
