import { RoleName } from '../types';
import { isExternalUser, isPartOfSameCompany } from './user';

describe('user utils', () => {
  describe(isExternalUser.name, () => {
    it.each`
      role                       | expected
      ${RoleName.Admin}          | ${false}
      ${RoleName.SupplierEditor} | ${true}
      ${RoleName.SupplierViewer} | ${true}
      ${undefined}               | ${false}
    `(
      'when user has $role role, it should return $expected',
      ({ role, expected }: { role?: RoleName; expected: boolean }) => {
        const result = isExternalUser(role);
        expect(result).toBe(expected);
      }
    );
  });

  describe(isPartOfSameCompany.name, () => {
    const companyId = '';
    const anotherCompanyId = '';

    describe('when user company id is the same as company id', () => {
      it('should return true', () => {
        const result = isPartOfSameCompany({
          userCompanyId: companyId,
          companyId,
        });

        expect(result).toBe(true);
      });
    });

    describe('when user company id is different company id', () => {
      it('should return false', () => {
        const result = isPartOfSameCompany({
          userCompanyId: companyId,
          companyId: anotherCompanyId,
        });

        expect(result).toBe(false);
      });
    });

    describe('when user company id is undefined', () => {
      it('should return false', () => {
        const result = isPartOfSameCompany({
          userCompanyId: companyId,
          companyId: undefined,
        });

        expect(result).toBe(false);
      });
    });

    describe('when company id is undefined', () => {
      it('should return false', () => {
        const result = isPartOfSameCompany({
          userCompanyId: undefined,
          companyId: anotherCompanyId,
        });

        expect(result).toBe(false);
      });
    });
  });
});
