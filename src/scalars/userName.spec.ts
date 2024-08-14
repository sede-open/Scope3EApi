import { validateAndSanitise } from './userName';

describe('userName', () => {
  describe('validateAndSanitise', () => {
    it('should return an error when provided input is a number', () => {
      expect.assertions(1);

      try {
        validateAndSanitise(1);
      } catch (err) {
        expect(err.message).toContain('Value is not a string');
      }
    });

    it('should return an error when provided input is a JSON', () => {
      expect.assertions(1);

      try {
        validateAndSanitise({ hello: 'hi' });
      } catch (err) {
        expect(err.message).toContain('Value is not a string');
      }
    });

    describe.each`
      forbiddenChar
      ${'^'}
      ${'!'}
      ${'@'}
      ${'&'}
      ${'#'}
      ${'$'}
      ${'%'}
      ${'('}
      ${')'}
      ${'{'}
      ${'}'}
      ${'"'}
      ${';'}
      ${':'}
      ${'<'}
      ${'>'}
      ${'}'}
      ${'.'}
      ${'?'}
      ${'+'}
      ${'='}
      ${'|'}
      ${'_'}
      ${'/'}
      ${'\\'}
    `(
      'when $forbiddenChar forbidden character is provided',
      ({ forbiddenChar }: { forbiddenChar: string }) => {
        it('should throw an error', () => {
          expect.assertions(1);
          try {
            validateAndSanitise(forbiddenChar);
          } catch (err) {
            expect(err.message).toContain(
              'Value contains forbidden characters'
            );
          }
        });
      }
    );

    describe.each`
      nonPrintableCharacter
      ${'©'}
      ${' '}
    `('first', ({ nonPrintableCharacter }) => {
      it('should throw an error', () => {
        expect.assertions(1);
        try {
          validateAndSanitise(nonPrintableCharacter);
        } catch (err) {
          expect(err.message).toContain(
            `Value contains non-printable characters: ${nonPrintableCharacter}`
          );
        }
      });
    });

    describe('when the string has less than 2 characters', () => {
      it.each`
        input
        ${'a'}
        ${' b'}
        ${'c '}
        ${' d '}
      `('should throw an error', ({ input }) => {
        expect.assertions(1);
        try {
          validateAndSanitise(input);
        } catch (error) {
          expect(error.message).toBe(
            'Value must contain at least 2 characters'
          );
        }
      });
    });

    describe('when the string contains more than 26 characters', () => {
      it('should throw an error', () => {
        expect.assertions(1);
        try {
          validateAndSanitise('a'.repeat(27));
        } catch (error) {
          expect(error.message).toBe(
            'Value must not contain more than 26 characters'
          );
        }
      });
    });

    describe('when the string does not contain any forbidden characters', () => {
      it('should return the string trimmed', () => {
        const notTrimmed = ' Hello there ';
        const result = validateAndSanitise(notTrimmed);
        expect(result).toEqual(notTrimmed.trim());
      });
    });
  });
});
