import { validateAndSanitise } from './pageSize';

describe('page size', () => {
  describe(validateAndSanitise.name, () => {
    it('should throw an error when provided input is not a number', () => {
      expect.assertions(1);

      try {
        validateAndSanitise('xxx');
      } catch (err) {
        expect(err.message).toContain('Value is not a whole number: xxx');
      }
    });

    it('should throw an error when a decimal number is provided', () => {
      expect.assertions(1);

      try {
        validateAndSanitise(6.3);
      } catch (err) {
        expect(err.message).toContain('Value is not a whole number: 6.3');
      }
    });

    it('should throw an error when a page size less than 1 is provided', () => {
      expect.assertions(1);

      try {
        validateAndSanitise(0);
      } catch (err) {
        expect(err.message).toContain('1 is the minimum value for page size');
      }
    });

    describe('when a page size is provided', () => {
      it('should should return the page size', () => {
        const validPageSize = 50;
        const result = validateAndSanitise(validPageSize);
        expect(result).toBe(validPageSize);
      });
    });
  });
});
