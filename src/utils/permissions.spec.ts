import { RoleEntity } from '../entities/Role';
import { UserEntityWithRoles } from '../entities/User';
import { getCurrentUser } from '../mocks/user';
import { CompanyStatus, RoleName } from '../types';
import {
  belongsToApprovedCompany,
  hasExternalRole,
  isApprovedCompany,
} from './permissions';

describe('permissions utils', () => {
  describe('hasExternalRole()', () => {
    describe.each`
      role
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return true', () => {
        const result = hasExternalRole(
          (getCurrentUser({
            roles: [
              {
                name: role,
                id: 'xx',
                createdAt: new Date('2020-08-27 09:11:00'),
                updatedAt: new Date('2020-08-27 09:11:00'),
              } as RoleEntity,
            ],
          }) as unknown) as UserEntityWithRoles
        );

        expect(result).toBe(true);
      });
    });

    describe.each`
      role
      ${RoleName.Admin}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      it('should return false', () => {
        const result = hasExternalRole(
          (getCurrentUser({
            roles: [
              {
                name: role,
                id: 'xx',
                createdAt: new Date('2020-08-27 09:11:00'),
                updatedAt: new Date('2020-08-27 09:11:00'),
              } as RoleEntity,
            ],
          }) as unknown) as UserEntityWithRoles
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('belongsToApprovedCompany()', () => {
    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should return true', () => {
          const result = belongsToApprovedCompany(
            getCurrentUser({ companyOverrides: { status: companyStatus } })
          );

          expect(result).toBe(true);
        });
      }
    );

    describe.each`
      companyStatus
      ${CompanyStatus.InvitationDeclined}
      ${CompanyStatus.PendingUserConfirmation}
      ${CompanyStatus.Vetoed}
      ${CompanyStatus.VettingInProgress}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should return false', () => {
          const result = belongsToApprovedCompany(
            getCurrentUser({ companyOverrides: { status: companyStatus } })
          );

          expect(result).toBe(false);
        });
      }
    );
  });

  describe('isApprovedCompany()', () => {
    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should return true', () => {
          const result = isApprovedCompany({
            status: companyStatus,
          });

          expect(result).toBe(true);
        });
      }
    );

    describe.each`
      companyStatus
      ${CompanyStatus.InvitationDeclined}
      ${CompanyStatus.PendingUserConfirmation}
      ${CompanyStatus.Vetoed}
      ${CompanyStatus.VettingInProgress}
    `(
      'when user belongs to a company with $companyStatus status',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should return false', () => {
          const result = isApprovedCompany({
            status: companyStatus,
          });

          expect(result).toBe(false);
        });
      }
    );
  });
});
