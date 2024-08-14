export const DEFAULT_JWT_EXPIRY_PERIOD = '14d';

/* All JWT's start with 'eyJ', can use this to assert a string is somewhat JWT like. */
export const JWT_MATCH_REGEXP = new RegExp('^eyJ?');
