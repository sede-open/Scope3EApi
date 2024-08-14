import { getSecondsInNumberOfDays } from './datetime';

describe('getSecondsInNumberOfDays', () => {
  it('should return the number of seconds in a day', () => {
    expect(getSecondsInNumberOfDays(1)).toEqual(86400);
  });

  it('should return the number of seconds in ten days', () => {
    expect(getSecondsInNumberOfDays(10)).toEqual(864000);
  });
});
