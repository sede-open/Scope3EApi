import { Request } from 'express';

export const getTokenFromRequest = (req: Request): string => {
  const header = req.headers.authorization;
  return header ? header.replace('Bearer ', '') : req.cookies.id_token;
};
