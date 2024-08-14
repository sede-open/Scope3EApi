import { getMockReq } from '@jest-mock/express';
import { getTokenFromRequest } from './getTokenFromRequest';

describe('getTokenFromRequest', () => {
  it('should retrieve the id_token header from an express request', () => {
    const req = getMockReq({
      cookies: { cookie: '11111111' },
      headers: { authorization: 'Bearer ABC12345' },
    });
    const expected = 'ABC12345';

    const actual = getTokenFromRequest(req);

    expect(actual).toEqual(expected);
  });

  it('should fallback by returning the id_token cookie from an express request when the id_token header is not present', () => {
    const req = getMockReq({
      cookies: { id_token: 'ABC12345' },
      headers: {},
    });
    const expected = 'ABC12345';

    const actual = getTokenFromRequest(req);

    expect(actual).toEqual(expected);
  });
});
