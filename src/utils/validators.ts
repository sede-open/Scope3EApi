import isEmail from 'validator/lib/isEmail';
import { CompanyRelationshipType, EmailEnquiry } from '../types';

export const isValidEmail = (value: string) => isEmail(value, {});

export const isValidEnquiry = (value: unknown) =>
  (Object.values(EmailEnquiry) as unknown[]).includes(value);

const doesEveryValuePass = (rule: (value: string) => boolean) => (
  values: string[]
): boolean => values.map(rule).every((result) => result === true);

export const doesNotContainHTML = (value: string): boolean =>
  (value.match(/<[^>]*>/) || []).length === 0;

export const isEveryInputSafe = doesEveryValuePass(doesNotContainHTML);

export const isEveryEmailValid = doesEveryValuePass(isValidEmail);

export const isInviteType = (
  inviteType: string
): inviteType is CompanyRelationshipType => {
  return Object.values(CompanyRelationshipType).includes(
    inviteType.toUpperCase() as CompanyRelationshipType
  );
};

export const validateIsTruthy = (value: unknown) => {
  if (!value) {
    throw new Error(`Value is required`);
  }
  return value;
};
