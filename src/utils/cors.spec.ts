import { getCorsOptions } from './cors';
import { getConfig, Environment } from '../config';

jest.mock('../config', () => {
  const actual = jest.requireActual('../config');
  return {
    ...actual,
    getConfig: jest.fn(),
  };
});

describe('getCorsOptions', () => {
  it('allows Apollo Studio client to make requests in the local environment', () => {
    (getConfig as jest.Mock).mockReturnValueOnce({
      environment: Environment.LOCAL,
    });

    expect(getCorsOptions()).toEqual({
      origin: ['https://studio.apollographql.com'],
    });
  });
  it.each`
    environment
    ${Environment.DEV}
    ${Environment.STAGING}
    ${Environment.PREPROD}
    ${Environment.PROD}
    ${Environment.TEST}
  `(
    'does not allow Apollo Studio client to make requests in other Environment',
    ({ environment }) => {
      (getConfig as jest.Mock).mockReturnValueOnce({
        environment,
      });

      expect(getCorsOptions()).toBe(false);
    }
  );
});
