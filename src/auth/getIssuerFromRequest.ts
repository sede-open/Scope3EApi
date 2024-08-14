import { Request } from 'express';
import { AuthProvider } from '../types';

export const getIssuerFromRequest = (req: Request): AuthProvider => {
  return (req.headers['x-token-issuer'] ||
    req.cookies.token_issuer) as AuthProvider;
};
