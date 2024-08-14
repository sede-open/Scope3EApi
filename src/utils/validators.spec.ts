import { EmailEnquiry } from '../types';
import { doesNotContainHTML, isValidEnquiry } from './validators';

describe('validators', () => {
  describe('doesNotContainHTML', () => {
    it.each`
      input
      ${'Hello <strong>there</strong>'}
      ${'Hello <a>there'}
      ${'< a href other stuff>'}
      ${'Hello <a href="url">there</a>'}
    `(
      'should return false for invalid input $input',
      ({ input }: { input: string }) => {
        expect(doesNotContainHTML(input)).toBe(false);
      }
    );

    it.each`
      input
      ${'No tags here'}
      ${'100 < 200'}
      ${'200 > 100'}
      ${'Nothing to >< worry about'}
    `(
      'should return true for valid input $input',
      ({ input }: { input: string }) => {
        expect(doesNotContainHTML(input)).toBe(true);
      }
    );
  });

  describe('isValidEnquiry', () => {
    describe('when a valid EmailEnquiry value is passed', () => {
      it('should return true', () => {
        const emailEnquiries = Object.values(EmailEnquiry);

        expect.assertions(emailEnquiries.length);

        emailEnquiries.forEach((validEnquiry) => {
          const result = isValidEnquiry(validEnquiry);
          expect(result).toBe(true);
        });
      });
    });

    describe('when an invalid EmailEnquiry value is passed', () => {
      it('should return false', () => {
        const invalidEnquiry = 'Random string';
        const result = isValidEnquiry(invalidEnquiry);
        expect(result).toBe(false);
      });
    });
  });
});
