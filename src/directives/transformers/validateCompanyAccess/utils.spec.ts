import { assertInputFieldsMatchObjectFieldArgs } from './utils';

describe('assertInputFieldsMatchObjectFieldArgs', () => {
  it('should return undefined when the field sets match', () => {
    const inputFields = ['companyId'];
    const objectFieldArgs = ['companyId'];

    expect(
      assertInputFieldsMatchObjectFieldArgs(inputFields, objectFieldArgs)
    ).toBeUndefined();
  });

  it('should throw an error when the field sets do not match', () => {
    const inputFields = ['companyId'];
    const objectFieldArgs = ['not-a-company-id'];

    expect(() =>
      assertInputFieldsMatchObjectFieldArgs(inputFields, objectFieldArgs)
    ).toThrowErrorMatchingInlineSnapshot(
      `"Error when validating input parameters. Missing input. [companyId] could not be found in [not-a-company-id]. This means you have likely misconfigured your GraphQL Schema."`
    );
  });
});
