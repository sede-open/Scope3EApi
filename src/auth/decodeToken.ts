import decode from 'jwt-decode';

export function decodeToken<T>(token: string): T | null {
  try {
    return decode<T>(token);
  } catch (e) {
    return null;
  }
}
