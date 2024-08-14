import { Request } from 'express';

// Akamai access token to connect to Akamai API
export const getAccessTokenFromRequest = (req: Request): string => {
  return (req.headers['x-access-token'] || req.cookies.access_token) as string;
};
