import moment from 'moment';

const EXPIRY_GRACE_PERIOD = 3600; // 1 hour

export const checkTokenExpiry = (createdAt: Date, expiresIn: number) => {
  return moment().isBefore(
    moment(createdAt).add(expiresIn - EXPIRY_GRACE_PERIOD, 'seconds')
  );
};
