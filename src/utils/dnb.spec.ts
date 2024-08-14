import moment from 'moment';
import { checkTokenExpiry } from './dnb';

describe('dnb utils', () => {
  describe('checkTokenExpiry', () => {
    describe('when expiry date is in the future', () => {
      it('should return true', () => {
        const createdAt = new Date();
        const expiresIn = 7200; // expires in 2 hours

        const result = checkTokenExpiry(createdAt, expiresIn);

        expect(result).toBe(true);
      });
    });

    describe('when expiry date is in the past', () => {
      it('should return false', () => {
        const createdAt = moment().subtract(10, 'days').toDate();
        const expiresIn = 7200; // expires in 2 hours

        const result = checkTokenExpiry(createdAt, expiresIn);

        expect(result).toBe(false);
      });
    });
  });
});
