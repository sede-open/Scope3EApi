/**
 * Ensure that the input fields on your dircetive match the input fields on your field object definition.
 *
 * ie, this should throw an error because of key mismatch:
 * ```
 * someQuery(companyId: ID!): Company
 *  @validateCompanyAccess(inputFieldsToValidate: ['not-a-company-id'])
 * ```
 */
export function assertInputFieldsMatchObjectFieldArgs(
  inputFields: string[],
  objectFieldArgs: string[]
) {
  const missingFields = inputFields.filter(
    (inputField) => !objectFieldArgs.includes(inputField)
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Error when validating input parameters. Missing input. [${missingFields.join(
        ', '
      )}] could not be found in [${objectFieldArgs.join(
        ', '
      )}]. This means you have likely misconfigured your GraphQL Schema.`
    );
  }
}
