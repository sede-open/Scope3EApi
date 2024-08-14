import moment from 'moment';

export const getSecondsInNumberOfDays = (numDays: number) => {
  return 60 * 60 * 24 * numDays;
};

export const formattedDateTimeNow = () => {
  return moment().format('hh:mm:ss');
};

export const getLastYear = () => {
  return new Date().getFullYear() - 1;
};
