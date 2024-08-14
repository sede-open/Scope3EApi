import { GraphQLResolveInfo } from 'graphql';
import { IContext } from '../../../apolloContext';
import { RoleEntity } from '../../../entities/Role';
import { RoleName } from '../../../types';
import { getCompanyAccessResolver } from './resolver';

describe('getCompanyAccessResolver', () => {
  it('should call the original resolver when the user is an admin and permitAdmins is true', async () => {
    const originalResolver = jest.fn();
    const resolve = getCompanyAccessResolver(originalResolver, {
      permitAdmins: true,
      inputFieldsToValidate: [],
    });

    await resolve(
      undefined,
      undefined,
      { user: { roles: [{ name: RoleName.Admin } as RoleEntity] } } as IContext,
      {} as GraphQLResolveInfo
    );

    expect(originalResolver).toHaveBeenCalled();
  });

  it("should throw an error when querying a field with a companyId input that does not match the user's companyId", async () => {
    const originalResolver = jest.fn();
    const resolve = getCompanyAccessResolver(originalResolver, {
      permitAdmins: false,
      inputFieldsToValidate: ['companyId'],
    });

    try {
      await resolve(
        undefined,
        { companyId: 'not-my-company-id' },
        { user: { companyId: 'my-company-id' } } as IContext,
        {} as GraphQLResolveInfo
      );
    } catch (error) {
      expect(error.message).toEqual(
        'Access Error when validating input parameters. "companyId" does not belong to the user\'s company.'
      );
    }

    expect.assertions(1);
  });
});
