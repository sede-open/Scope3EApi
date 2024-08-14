import { validateAndSanitise } from './safeString';

describe('safeString', () => {
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

    it('should return an error when provided input contains html', () => {
      expect.assertions(1);

      try {
        validateAndSanitise('<a />');
      } catch (err) {
        expect(err.message).toContain(
          'Value contains non-printable or forbidden characters'
        );
      }
    });

    it('Any <, >, &, \', " and / will be replaced with HTML entities within the string', () => {
      const stringToSanitise =
        '</ img src=http://fewhfekjwfhjehfew.collab.b8.ee/emailtest&/ ""';

      const result = validateAndSanitise(stringToSanitise);

      expect(result).toEqual(
        '&lt;&#x2F; img src=http:&#x2F;&#x2F;fewhfekjwfhjehfew.collab.b8.ee&#x2F;emailtest&amp;&#x2F; &quot;&quot;'
      );
    });

    describe.each`
      forbiddenChar
      ${'ë'}
      ${'č'}
      ${'\u0383'}
      ${'\u038B'}
      ${'\u038D'}
      ${'\u03A2'}
      ${'\u05C8'}
      ${'\u05EB'}
    `(
      'when $forbiddenChar forbidden character is provided',
      ({ forbiddenChar }: { forbiddenChar: string }) => {
        it('should throw an error', () => {
          expect.assertions(1);
          try {
            validateAndSanitise(forbiddenChar);
          } catch (err) {
            expect(err.message).toContain(
              'Value contains non-printable or forbidden characters'
            );
          }
        });
      }
    );

    describe('when the string does not contain any replaceable characters', () => {
      it('should return the string as is', () => {
        const cleanString = 'Hello there!';

        const result = validateAndSanitise(cleanString);

        expect(result).toEqual(cleanString);
      });
    });

    describe('when the string is empty', () => {
      it('should return an empty string', () => {
        const emptyString = '';

        const result = validateAndSanitise(emptyString);

        expect(result).toBe(emptyString);
      });
    });
  });
});
