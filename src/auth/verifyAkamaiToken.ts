import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

export async function verifyAkamaiToken(token: string): Promise<boolean> {
  const akamaiJwksClient = jwksClient({
    jwksUri: `${process.env.AKAMAI_BASE_URL}/.well-known/jwks` ?? '',
  });

  return new Promise<boolean>((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        if (!header.kid) {
          reject(new Error('kid not found'));
          return;
        }
        akamaiJwksClient.getSigningKey(header.kid, (err, key) => {
          if (err) {
            reject(err);
            return;
          }
          callback(null, key.getPublicKey());
        });
      },
      {},
      (error) => {
        return resolve(!error);
      }
    );
  });
}
