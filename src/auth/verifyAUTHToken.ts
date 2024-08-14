import fetch from 'node-fetch';
import { logger } from '../utils/logger';

const INVALID_CLIENT_ID_ERROR_MESSAGE =
  'Valid AUTH token belonging to a different client id has been used';

export const verifyAUTHToken = async (token: string): Promise<boolean> => {
  const payload = new URLSearchParams();

  payload.append(
    'grant_type',
    'urn:pingidentity.com:oauth2:grant_type:validate_bearer'
  );
  payload.append('token', token);

  try {
    const basicAuth = Buffer.from(
      `${process.env.AUTH_CLIENT_ID}:${process.env.AUTH_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch(`${process.env.AUTH_TOKEN_API}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: payload,
    });

    const json = await tokenResponse.json();

    if (json.client_id === process.env.AUTH_CLIENT_ID) {
      return true;
    }

    logger.warn(INVALID_CLIENT_ID_ERROR_MESSAGE);
    return false;
  } catch (err) {
    logger.error(`Failed to verify AUTH token: ${err.message}`);
    return false;
  }
};
