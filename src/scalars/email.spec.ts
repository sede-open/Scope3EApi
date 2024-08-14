import { validateAndSanitise } from './email';

describe('email', () => {
  describe('validateAndSanitise', () => {
    it('should return an error when provided input is not a string', () => {
      expect.assertions(1);

      try {
        validateAndSanitise(1);
      } catch (err) {
        expect(err.message).toContain('Value is not a string');
      }
    });

    it.each`
      nonEmail
      ${'@test.com'}
      ${'test.com'}
      ${'["test"]@test.com'}
      ${'test@test'}
    `(
      'should should throw an error when a non-email value is provided',
      ({ nonEmail }: { nonEmail: string }) => {
        expect.assertions(1);

        try {
          validateAndSanitise(nonEmail);
        } catch (err) {
          expect(err.message).toContain(
            `Value is not a valid email address: ${nonEmail}`
          );
        }
      }
    );

    describe('when a valid email is provided', () => {
      it('should should return email', () => {
        const validEmail = 'test@test.com';
        const result = validateAndSanitise(validEmail);
        expect(result).toBe(validEmail);
      });
    });
  });
});
