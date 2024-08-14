import { Repository } from 'typeorm';

import {
  ACCEPT_INVITE_SUCCESS,
  CompanyController,
  COMPANY_DOESNT_EXIST,
  COMPANY_EXISTS_ERROR,
  COMPANY_STATUS_CHANGE_INVALID,
  DECLINE_INVITE_SUCCESS,
  DNB_PROFILE_ERROR,
} from './';
import { companyMock, company4Mock } from '../../mocks/company';
import { IContext } from '../../apolloContext';
import { CompanyEntity } from '../../entities/Company';
import { CompaniesBenchmarkInput, CompanyStatus, OrderBy } from '../../types';
import { getDnBCompanyProfile } from '../../mocks/dnbCompanyProfile';
import { sectorMock } from '../../mocks/sector';
import { companySectorMock } from '../../mocks/companySector';
import {
  getCurrentUser,
  supplierEditorUser2Mock,
  supplierEditorUserMock,
  supportUserMock,
} from '../../mocks/user';
import {
  COMPANY_CREATED_ACTION,
  COMPANY_UPDATED_ACTION,
} from '../../constants/audit';
import { companyCustomerMock } from '../../mocks/companyRelationship';
import { AkamaiUserAlreadyExistsError } from '../../utils/errors';
import { UserRepository } from '../../repositories/UserRepository';
import { Flags, getConfig } from '../../config';
import { CompanyService } from '../../services/CompanyService';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import { USER_COMPANY_CANNOT_ACCESS } from '../../errors/commonErrorMessages';

jest.mock('../../config', () => {
  const actual = jest.requireActual('../../config');
  return {
    ...actual,
    getConfig: jest.fn().mockReturnValue({
      flags: {},
    }),
  };
});

describe('CompanyController', () => {
  describe('findById()', () => {
    it('should return a company', async () => {
      const find = jest.fn();
      const companyRepositoryMock = ({
        find,
      } as unknown) as Repository<CompanyEntity>;
      find.mockImplementation(() => [companyMock]);
      const userRepositoryMock = ({
        companyUsers: jest.fn(() => []),
      } as unknown) as UserRepository;
      const controller = new CompanyController(
        companyRepositoryMock,
        userRepositoryMock,
        {} as CompanyService
      );

      const result = await controller.findById(
        { id: companyMock.id },
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        where: { id: companyMock.id },
      });
      expect(result).toEqual(companyMock);
    });
  });

  describe('findByDuns()', () => {
    it('should return a company', async () => {
      const find = jest.fn();
      const companyRepositoryMock = ({
        find,
      } as unknown) as Repository<CompanyEntity>;
      find.mockImplementation(() => [companyMock]);
      const userRepositoryMock = ({
        companyUsers: jest.fn(() => []),
      } as unknown) as UserRepository;
      const controller = new CompanyController(
        companyRepositoryMock,
        userRepositoryMock,
        {} as CompanyService
      );

      const result = await controller.findByDuns(
        { duns: companyMock.duns },
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        where: { duns: companyMock.duns },
      });
      expect(result).toEqual(companyMock);
    });
  });

  describe('findAll()', () => {
    it('should return a list of companies', async () => {
      const companies = [companyMock];
      const findAndCount = jest.fn();
      const companyRepositoryMock = ({
        findAndCount,
      } as unknown) as Repository<CompanyEntity>;
      findAndCount.mockImplementation(() => [companies, companies.length]);
      const userRepositoryMock = ({
        companyUsers: jest.fn(() => []),
      } as unknown) as UserRepository;

      const controller = new CompanyController(
        companyRepositoryMock,
        userRepositoryMock,
        {} as CompanyService
      );

      const result = await controller.findAndCount(
        { offset: 0, limit: 1000 },
        (jest.fn() as unknown) as IContext
      );

      expect(findAndCount).toHaveBeenCalledWith({
        order: { name: OrderBy.Asc },
        take: 1000,
        skip: 0,
      });
      expect(result).toEqual({ data: companies, total: companies.length });
    });
  });

  describe('create()', () => {
    const dnbProfileMock = getDnBCompanyProfile();

    const setupCreate = async ({
      saveMock,
      saveAuditTrailMock,
      createCompanySectorMock,
      findOrCreateSectorFromDnBProfileMock,
      dnbProfileMockOverride,
      findCompanyOverride,
    }: {
      saveMock?: jest.Mock;
      saveAuditTrailMock?: jest.Mock;
      createCompanySectorMock?: jest.Mock;
      findOrCreateSectorFromDnBProfileMock?: jest.Mock;
      dnbProfileMockOverride?: null;
      findCompanyOverride?: unknown[];
    }) => {
      const dnbCompanyByDuns = jest.fn();
      dnbCompanyByDuns.mockImplementation(() =>
        typeof dnbProfileMockOverride !== 'undefined'
          ? dnbProfileMockOverride
          : dnbProfileMock
      );

      const findOrCreateSectorFromDnBProfile =
        findOrCreateSectorFromDnBProfileMock ?? jest.fn();
      findOrCreateSectorFromDnBProfile.mockImplementation(() => sectorMock);

      const createCompanySector = createCompanySectorMock ?? jest.fn();
      createCompanySector.mockImplementation(() => companySectorMock);

      const saveAuditTrail = saveAuditTrailMock ?? jest.fn();

      const mockContext = {
        services: {
          dnb: {
            companyByDuns: dnbCompanyByDuns,
          },
        },
        controllers: {
          sector: {
            findOrCreateFromDnBProfile: findOrCreateSectorFromDnBProfile,
          },
          companySector: {
            create: createCompanySector,
          },
          audit: {
            saveAuditTrail,
          },
        },
        user: supplierEditorUserMock,
      };

      const find = jest.fn();
      find.mockImplementation(() => findCompanyOverride ?? []);

      const save = saveMock ?? jest.fn();
      save.mockImplementation(() => companyMock);

      const companyRepositoryMock = ({
        find,
        save,
      } as unknown) as Repository<CompanyEntity>;

      const userRepositoryMock = ({
        companyUsers: jest.fn(() => []),
      } as unknown) as UserRepository;

      const controller = new CompanyController(
        companyRepositoryMock,
        userRepositoryMock,
        {} as CompanyService
      );

      return controller.create(
        { duns: dnbProfileMock.duns },
        (mockContext as unknown) as IContext
      );
    };

    describe('when a company is successfully created', () => {
      it('should save and return the new company', async () => {
        const save = jest.fn();

        const result = await setupCreate({
          saveMock: save,
        });

        expect(save).toHaveBeenCalledWith(
          {
            name: dnbProfileMock.name,
            duns: dnbProfileMock.duns,
            location: '',
            dnbRegion: dnbProfileMock.region,
            dnbCountry: dnbProfileMock.countryName,
            dnbCountryIso: dnbProfileMock.countryIso,
            dnbAddressLineOne: dnbProfileMock.addressLineOne,
            dnbAddressLineTwo: dnbProfileMock.addressLineTwo,
            dnbPostalCode: dnbProfileMock.postalCode,
            status: CompanyStatus.PendingUserConfirmation,
            createdBy: supplierEditorUserMock.id,
            businessSection: undefined,
            subSector: undefined,
          },
          { listeners: false }
        );

        expect(result).toEqual(companyMock);
      });

      it('should record an audit trail', async () => {
        const saveAuditTrail = jest.fn();

        await setupCreate({
          saveAuditTrailMock: saveAuditTrail,
        });

        const [[saveAuditTrailCall]] = saveAuditTrail.mock.calls;
        expect(saveAuditTrailCall).toEqual({
          userId: supplierEditorUserMock.id,
          action: COMPANY_CREATED_ACTION,
          currentPayload: JSON.stringify(companyMock),
        });
      });

      it('should create company sectors', async () => {
        const createCompanySectorMock = jest.fn();
        const findOrCreateSectorFromDnBProfileMock = jest.fn();

        await setupCreate({
          createCompanySectorMock,
          findOrCreateSectorFromDnBProfileMock,
        });

        expect(findOrCreateSectorFromDnBProfileMock).toHaveBeenCalledTimes(2);
        expect(createCompanySectorMock).toHaveBeenCalledTimes(2);
      });
    });

    describe('when D&B profile does not exist for the DUNS number', () => {
      it('should throw an error', async () => {
        const dnbProfileMockOverride = null;

        expect.assertions(1);

        try {
          await setupCreate({
            dnbProfileMockOverride,
          });
        } catch (err) {
          expect(err.message).toBe(DNB_PROFILE_ERROR);
        }
      });
    });

    describe('when a company already exists for the DUNS number', () => {
      it('should throw an error', async () => {
        const findCompanyOverride = [companyMock];
        expect.assertions(1);

        try {
          await setupCreate({
            findCompanyOverride,
          });
        } catch (err) {
          expect(err.message).toBe(COMPANY_EXISTS_ERROR);
        }
      });
    });
  });

  describe('updateCompanyStatus()', () => {
    const updatedCompanyStatus = {
      id: '63ac35c6-6a25-4867-a936-9873b4100048',
      name: 'B Corp Company',
      location: 'UK',
      businessSection: 'IT',
      subSector: 'consulting',
      createdAt: '2020-08-27 09:11:00',
      updatedAt: '2020-08-27 09:11:00',
      reviewedAt: null,
      updatedBy: 'd986168b-9b95-4dc3-830c-79037878c35f',
      duns: '3311111112',
      dnbPostalCode: 'BBB BBBB',
      dnbRegion: 'Manchester',
      dnbCountry: 'United Kingdom',
      dnbCountryIso: 'UK',
      dnbAddressLineOne: 'Sunny St',
      dnbAddressLineTwo: 'Sunny road',
      status: CompanyStatus.PendingUserActivation,
    };

    it('should update company status', async () => {
      const previousPayload = JSON.stringify(company4Mock);

      const saveAuditTrail = jest.fn();
      const save = jest.fn();
      const companyRepositoryMock = ({
        save,
        findOne: () => company4Mock,
      } as unknown) as Repository<CompanyEntity>;
      save.mockImplementation(() => updatedCompanyStatus);
      const userRepositoryMock = ({
        companyUsers: jest.fn(() => []),
      } as unknown) as UserRepository;

      const mockContext = ({
        user: supportUserMock,
        controllers: { audit: { saveAuditTrail } },
      } as unknown) as IContext;
      const controller = new CompanyController(
        companyRepositoryMock,
        userRepositoryMock,
        {} as CompanyService
      );

      const result = await controller.updateCompanyStatus(
        {
          id: company4Mock.id,
          status: updatedCompanyStatus.status,
        },
        mockContext
      );

      expect(result).toEqual(updatedCompanyStatus);
      const [[auditCall]] = saveAuditTrail.mock.calls;
      expect(auditCall).toEqual(
        expect.objectContaining({
          userId: supportUserMock.id,
          action: COMPANY_UPDATED_ACTION,
          currentPayload: JSON.stringify(updatedCompanyStatus),
          previousPayload,
        })
      );
    });

    it('should throw an error if the company status for given ID does not exist', async () => {
      const companyRepositoryMock = ({
        save: jest.fn(),
        findOne: () => undefined,
      } as unknown) as Repository<CompanyEntity>;
      const userRepositoryMock = ({
        companyUsers: jest.fn(() => []),
      } as unknown) as UserRepository;

      const mockContext = ({
        user: supportUserMock,
      } as unknown) as IContext;
      const controller = new CompanyController(
        companyRepositoryMock,
        userRepositoryMock,
        {} as CompanyService
      );

      try {
        await controller.updateCompanyStatus(
          {
            id: company4Mock.id,
            status: updatedCompanyStatus.status,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(COMPANY_DOESNT_EXIST);
      }
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Vetoed}
      ${CompanyStatus.PendingUserActivation}
    `(
      'when company status changes to $companyStatus from VETTING_IN_PROGRESS',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should set reviewed_at date', async () => {
          const saveAuditTrail = jest.fn();
          const save = jest.fn();
          const companyRepositoryMock = ({
            save,
            findOne: () => ({
              ...company4Mock,
              reviewedAt: null,
              status: CompanyStatus.VettingInProgress,
            }),
          } as unknown) as Repository<CompanyEntity>;
          const userRepositoryMock = ({
            companyUsers: jest.fn(() => []),
          } as unknown) as UserRepository;

          const mockContext = ({
            user: supportUserMock,
            controllers: { audit: { saveAuditTrail } },
          } as unknown) as IContext;
          const controller = new CompanyController(
            companyRepositoryMock,
            userRepositoryMock,
            {} as CompanyService
          );

          await controller.updateCompanyStatus(
            {
              id: company4Mock.id,
              status: companyStatus,
            },
            mockContext
          );

          const [[saveCall]] = save.mock.calls;

          expect(saveCall.status).toEqual(companyStatus);
          expect(saveCall.reviewedAt).not.toBeNull();
        });
      }
    );

    describe('when company status changes to PENDING_USER_CONFIRMATION TO VETTING_IN_PROGRESS', () => {
      it('should set reviewed_at date', async () => {
        const saveAuditTrail = jest.fn();
        const save = jest.fn();
        const companyRepositoryMock = ({
          save,
          findOne: () => ({
            ...company4Mock,
            reviewedAt: null,
            status: CompanyStatus.PendingUserConfirmation,
          }),
        } as unknown) as Repository<CompanyEntity>;
        const userRepositoryMock = ({
          companyUsers: jest.fn(() => []),
        } as unknown) as UserRepository;

        const mockContext = ({
          user: supportUserMock,
          controllers: { audit: { saveAuditTrail } },
        } as unknown) as IContext;
        const controller = new CompanyController(
          companyRepositoryMock,
          userRepositoryMock,
          {} as CompanyService
        );

        await controller.updateCompanyStatus(
          {
            id: company4Mock.id,
            status: CompanyStatus.VettingInProgress,
          },
          mockContext
        );

        const [[saveCall]] = save.mock.calls;
        expect(saveCall.status).toEqual(CompanyStatus.VettingInProgress);
        expect(saveCall.reviewedAt).toBeNull();
      });
    });
  });

  describe('acceptInvite', () => {
    const token = 'INVITE_TOKEN';

    const originalCompany = {
      ...companyMock,
      status: CompanyStatus.PendingUserConfirmation,
    };

    const previousPayload = JSON.stringify(originalCompany);

    const updatedCompany = {
      ...originalCompany,
      status: CompanyStatus.VettingInProgress,
    };

    const currentUser = getCurrentUser({
      userOverrides: { companyId: originalCompany.id },
      companyOverrides: { id: originalCompany.id },
    });

    it('should update the company status', async () => {
      const saveAuditTrail = jest.fn();
      const save = jest.fn();
      const companyRepositoryMock = ({
        save,
        findOne: () => originalCompany,
      } as unknown) as Repository<CompanyEntity>;
      const userRepositoryMock = ({
        companyUsers: jest.fn(() => []),
      } as unknown) as UserRepository;
      save.mockImplementation(() => updatedCompany);
      const saveUsedToken = jest.fn();

      const notifyOfCompanyToBeVetted = jest.fn();
      const mockContext = ({
        token,
        user: currentUser,
        controllers: { audit: { saveAuditTrail } },
        clients: {
          notification: {
            notifyOfCompanyToBeVetted,
          },
        },
        services: {
          jwt: {
            saveUsedToken,
          },
        },
      } as unknown) as IContext;
      const controller = new CompanyController(
        companyRepositoryMock,
        userRepositoryMock,
        {} as CompanyService
      );

      const result = await controller.acceptInvite(
        {
          companyId: originalCompany.id,
        },
        mockContext
      );

      expect(result).toEqual(ACCEPT_INVITE_SUCCESS);
      const [[auditCall]] = saveAuditTrail.mock.calls;
      expect(auditCall).toEqual(
        expect.objectContaining({
          userId: currentUser.id,
          action: COMPANY_UPDATED_ACTION,
          currentPayload: JSON.stringify(updatedCompany),
          previousPayload,
        })
      );
      expect(notifyOfCompanyToBeVetted).toHaveBeenCalledWith({
        company: updatedCompany,
      });
      expect(saveUsedToken).toHaveBeenCalledWith({
        userId: currentUser.id,
        token,
      });
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.InvitationDeclined}
      ${CompanyStatus.PendingUserActivation}
      ${CompanyStatus.Vetoed}
      ${CompanyStatus.VettingInProgress}
    `(
      'when the current company status is $companyStatus',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should not permit the user to accept the invite', async () => {
          const companyRepositoryMock = ({
            findOne: () => ({ ...originalCompany, status: companyStatus }),
          } as unknown) as Repository<CompanyEntity>;
          const userRepositoryMock = ({
            companyUsers: jest.fn(() => []),
          } as unknown) as UserRepository;

          const mockContext = ({
            user: currentUser,
          } as unknown) as IContext;
          const controller = new CompanyController(
            companyRepositoryMock,
            userRepositoryMock,
            {} as CompanyService
          );

          try {
            await controller.acceptInvite(
              {
                companyId: originalCompany.id,
              },
              mockContext
            );
          } catch (err) {
            expect(err.message).toBe(COMPANY_STATUS_CHANGE_INVALID);
          }
        });
      }
    );
  });

  describe('declineInvite', () => {
    // Delete this after deprecating mulesoft notification
    describe('with Mulesoft notification', () => {
      (getConfig as jest.Mock).mockReturnValueOnce({
        flags: {
          [Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED]: false,
        },
      });
      const token = 'INVITE_TOKEN';

      const inviterCompanyId = '';

      const originalCompany = {
        ...companyMock,
        status: CompanyStatus.PendingUserConfirmation,
      };

      const previousPayload = JSON.stringify(originalCompany);

      const updatedCompany = {
        ...originalCompany,
        status: CompanyStatus.InvitationDeclined,
      };

      const currentUser = getCurrentUser({
        userOverrides: { companyId: originalCompany.id },
        companyOverrides: { id: originalCompany.id },
      });

      const declineInput = {
        companyId: originalCompany.id,
        reason: 'No thanks',
      };

      it('should update the company status', async () => {
        const saveAuditTrail = jest.fn();
        const save = jest.fn();
        const repositoryMock = ({
          save,
          findOne: () => originalCompany,
        } as unknown) as Repository<CompanyEntity>;
        save.mockImplementation(() => updatedCompany);

        const usersToNotify = [supplierEditorUserMock, supplierEditorUser2Mock];

        const userRepositoryMock = ({
          companyUsers: jest.fn(() => usersToNotify),
        } as unknown) as UserRepository;
        const saveUsedToken = jest.fn();

        const notifyOfDeclinedInvitation = jest.fn();
        const deleteAllByCompanyId = jest.fn();
        deleteAllByCompanyId.mockImplementation(() => [
          {
            ...companyCustomerMock,
            supplierId: originalCompany.id,
            customerId: inviterCompanyId,
          },
        ]);

        const mockContext = ({
          token,
          user: currentUser,
          controllers: {
            audit: {
              saveAuditTrail,
            },
            companyRelationship: {
              deleteAllByCompanyId,
            },
            user: {
              deleteByCompanyId: jest.fn(),
            },
          },
          clients: {
            notification: {
              notifyOfDeclinedInvitation,
            },
            hubspotEmail: {
              sendJoiningInvitationDeclined: jest.fn(),
            },
          },
          services: {
            jwt: {
              saveUsedToken,
            },
          },
        } as unknown) as IContext;
        const controller = new CompanyController(
          repositoryMock,
          userRepositoryMock,
          {} as CompanyService
        );

        const result = await controller.declineInvite(
          declineInput,
          mockContext
        );

        expect(result).toEqual(DECLINE_INVITE_SUCCESS);
        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall).toEqual(
          expect.objectContaining({
            userId: currentUser.id,
            action: COMPANY_UPDATED_ACTION,
            currentPayload: JSON.stringify(updatedCompany),
            previousPayload,
          })
        );
        expect(notifyOfDeclinedInvitation).toHaveBeenCalledTimes(
          usersToNotify.length
        );
        expect(saveUsedToken).toHaveBeenCalledWith({
          userId: currentUser.id,
          token,
        });
      });
    });
    describe('with Hubspot notification', () => {
      (getConfig as jest.Mock).mockReturnValueOnce({
        flags: {
          [Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED]: true,
        },
      });
      const token = 'INVITE_TOKEN';

      const inviterCompanyId = '';

      const originalCompany = {
        ...companyMock,
        status: CompanyStatus.PendingUserConfirmation,
      };

      const previousPayload = JSON.stringify(originalCompany);

      const updatedCompany = {
        ...originalCompany,
        status: CompanyStatus.InvitationDeclined,
      };

      const currentUser = getCurrentUser({
        userOverrides: { companyId: originalCompany.id },
        companyOverrides: { id: originalCompany.id },
      });

      const declineInput = {
        companyId: originalCompany.id,
        reason: 'No thanks',
      };

      it('should update the company status', async () => {
        const saveAuditTrail = jest.fn();
        const save = jest.fn();
        const repositoryMock = ({
          save,
          findOne: () => originalCompany,
        } as unknown) as Repository<CompanyEntity>;
        save.mockImplementation(() => updatedCompany);
        const saveUsedToken = jest.fn();

        const userRepositoryMock = ({
          companyUsers: jest.fn(() => userToNotify),
        } as unknown) as UserRepository;

        const sendJoiningInvitationDeclined = jest.fn();
        const deleteAllByCompanyId = jest.fn();
        deleteAllByCompanyId.mockImplementation(() => [
          {
            ...companyCustomerMock,
            supplierId: originalCompany.id,
            customerId: inviterCompanyId,
          },
        ]);

        const userToNotify = [supplierEditorUserMock, supplierEditorUser2Mock];

        const mockContext = ({
          token,
          user: currentUser,
          controllers: {
            audit: {
              saveAuditTrail,
            },
            companyRelationship: {
              deleteAllByCompanyId,
            },
            user: {
              deleteByCompanyId: jest.fn(),
            },
          },
          clients: {
            notification: {
              notifyOfDeclinedInvitation: jest.fn(),
            },
            hubspotEmail: {
              sendJoiningInvitationDeclined,
            },
          },
          services: {
            jwt: {
              saveUsedToken,
            },
          },
        } as unknown) as IContext;
        const controller = new CompanyController(
          repositoryMock,
          userRepositoryMock,
          {} as CompanyService
        );

        const result = await controller.declineInvite(
          declineInput,
          mockContext
        );

        expect(result).toEqual(DECLINE_INVITE_SUCCESS);
        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall).toEqual(
          expect.objectContaining({
            userId: currentUser.id,
            action: COMPANY_UPDATED_ACTION,
            currentPayload: JSON.stringify(updatedCompany),
            previousPayload,
          })
        );
        expect(sendJoiningInvitationDeclined).toHaveBeenCalledTimes(
          userToNotify.length
        );
        expect(saveUsedToken).toHaveBeenCalledWith({
          userId: currentUser.id,
          token,
        });
      });

      describe.each`
        companyStatus
        ${CompanyStatus.Active}
        ${CompanyStatus.InvitationDeclined}
        ${CompanyStatus.PendingUserActivation}
        ${CompanyStatus.Vetoed}
        ${CompanyStatus.VettingInProgress}
      `(
        'when the current company status is $companyStatus',
        ({ companyStatus }: { companyStatus: CompanyStatus }) => {
          it('should not permit the user to accept the invite', async () => {
            const repositoryMock = ({
              findOne: () => ({ ...originalCompany, status: companyStatus }),
            } as unknown) as Repository<CompanyEntity>;
            const userRepositoryMock = ({
              companyUsers: jest.fn(() => []),
            } as unknown) as UserRepository;

            const mockContext = ({
              user: currentUser,
            } as unknown) as IContext;
            const controller = new CompanyController(
              repositoryMock,
              userRepositoryMock,
              {} as CompanyService
            );

            try {
              await controller.declineInvite(declineInput, mockContext);
            } catch (err) {
              expect(err.message).toBe(COMPANY_STATUS_CHANGE_INVALID);
            }
          });
        }
      );
    });
  });

  describe('vetoCompany', () => {
    // delete this after deprecating Mulesoft notification
    describe('with Mulesoft notification', () => {
      const originalCompany = {
        ...companyMock,
        status: CompanyStatus.VettingInProgress,
      };

      const previousPayload = JSON.stringify(originalCompany);

      const updatedCompany = {
        ...originalCompany,
        status: CompanyStatus.Vetoed,
      };

      const currentUser = getCurrentUser({});

      const vetoInput = {
        companyId: originalCompany.id,
      };

      it('should update the company status', async () => {
        (getConfig as jest.Mock).mockReturnValueOnce({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED]: false,
          },
        });
        const saveAuditTrail = jest.fn();
        const save = jest.fn();
        const repositoryMock = ({
          save,
          findOne: () => originalCompany,
        } as unknown) as Repository<CompanyEntity>;
        save.mockImplementation(() => updatedCompany);
        const invitersToNotify = [
          supplierEditorUserMock,
          supplierEditorUser2Mock,
        ];
        const userRepositoryMock = ({
          companyUsers: jest.fn(() => invitersToNotify),
        } as unknown) as UserRepository;

        const notifyInviterOfVetoedCompany = jest.fn();
        const notifyInviteeOfVetoedCompany = jest.fn();
        const findByCompanyId = jest.fn();
        findByCompanyId.mockImplementation(() => [
          {
            ...companyCustomerMock,
            supplierId: originalCompany.id,
            customerId: supplierEditorUserMock.companyId,
          },
        ]);

        const mockContext = ({
          user: currentUser,
          controllers: {
            audit: {
              saveAuditTrail,
            },
            companyRelationship: {
              findByCompanyId,
            },
            user: {
              findAllByCompanyId: jest.fn(() => [supplierEditorUserMock]),
              deleteByCompanyId: jest.fn(),
            },
          },
          clients: {
            notification: {
              notifyInviterOfVetoedCompany,
              notifyInviteeOfVetoedCompany,
            },
          },
        } as unknown) as IContext;
        const controller = new CompanyController(
          repositoryMock,
          userRepositoryMock,
          {} as CompanyService
        );

        const result = await controller.vetoCompany(vetoInput, mockContext);

        expect(result).toEqual(updatedCompany);
        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall).toEqual(
          expect.objectContaining({
            userId: currentUser.id,
            action: COMPANY_UPDATED_ACTION,
            currentPayload: JSON.stringify(updatedCompany),
            previousPayload,
          })
        );
        expect(notifyInviterOfVetoedCompany).toHaveBeenCalledTimes(
          invitersToNotify.length
        );
        expect(notifyInviteeOfVetoedCompany).toHaveBeenCalledWith({
          recipient: supplierEditorUserMock,
        });
      });
    });
    describe('with Hubspot notification', () => {
      const originalCompany = {
        ...companyMock,
        status: CompanyStatus.VettingInProgress,
      };

      const previousPayload = JSON.stringify(originalCompany);

      const updatedCompany = {
        ...originalCompany,
        status: CompanyStatus.Vetoed,
      };

      const currentUser = getCurrentUser({});

      const vetoInput = {
        companyId: originalCompany.id,
      };

      it('should update the company status', async () => {
        (getConfig as jest.Mock).mockReturnValueOnce({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED]: true,
          },
        });
        const saveAuditTrail = jest.fn();
        const save = jest.fn();
        const repositoryMock = ({
          save,
          findOne: () => originalCompany,
        } as unknown) as Repository<CompanyEntity>;
        save.mockImplementation(() => updatedCompany);
        const invitersToNotify = [
          supplierEditorUserMock,
          supplierEditorUser2Mock,
        ];
        const userRepositoryMock = ({
          companyUsers: jest.fn(() => invitersToNotify),
        } as unknown) as UserRepository;

        const sendUnableToInviteCompanyEmail = jest.fn();
        const sendRegistrationUnsuccessfulEmail = jest.fn();
        const findByCompanyId = jest.fn();
        findByCompanyId.mockImplementation(() => [
          {
            ...companyCustomerMock,
            supplierId: originalCompany.id,
            customerId: supplierEditorUserMock.companyId,
          },
        ]);
        const mockContext = ({
          user: currentUser,
          controllers: {
            audit: {
              saveAuditTrail,
            },
            companyRelationship: {
              findByCompanyId,
            },
            user: {
              findAllByCompanyId: jest.fn(() => [supplierEditorUserMock]),
              deleteByCompanyId: jest.fn(),
            },
          },
          clients: {
            hubspotEmail: {
              sendUnableToInviteCompanyEmail,
              sendRegistrationUnsuccessfulEmail,
            },
          },
        } as unknown) as IContext;
        const controller = new CompanyController(
          repositoryMock,
          userRepositoryMock,
          {} as CompanyService
        );

        const result = await controller.vetoCompany(vetoInput, mockContext);

        expect(result).toEqual(updatedCompany);
        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall).toEqual(
          expect.objectContaining({
            userId: currentUser.id,
            action: COMPANY_UPDATED_ACTION,
            currentPayload: JSON.stringify(updatedCompany),
            previousPayload,
          })
        );
        expect(sendUnableToInviteCompanyEmail).toHaveBeenCalledTimes(
          invitersToNotify.length
        );
        expect(sendRegistrationUnsuccessfulEmail).toHaveBeenCalledWith({
          recipient: supplierEditorUserMock,
        });
      });

      describe.each`
        companyStatus
        ${CompanyStatus.Active}
        ${CompanyStatus.InvitationDeclined}
        ${CompanyStatus.PendingUserActivation}
        ${CompanyStatus.Vetoed}
        ${CompanyStatus.PendingUserConfirmation}
      `(
        'when the current company status is $companyStatus',
        ({ companyStatus }: { companyStatus: CompanyStatus }) => {
          it('should not permit the user to veto a company', async () => {
            const repositoryMock = ({
              findOne: () => ({ ...originalCompany, status: companyStatus }),
            } as unknown) as Repository<CompanyEntity>;
            const userRepositoryMock = ({
              companyUsers: jest.fn(() => []),
            } as unknown) as UserRepository;

            const mockContext = ({
              user: currentUser,
            } as unknown) as IContext;
            const controller = new CompanyController(
              repositoryMock,
              userRepositoryMock,
              {} as CompanyService
            );

            try {
              await controller.vetoCompany(vetoInput, mockContext);
            } catch (err) {
              expect(err.message).toBe(COMPANY_STATUS_CHANGE_INVALID);
            }
          });
        }
      );
    });
  });

  describe('approveCompany', () => {
    const originalCompany = {
      ...companyMock,
      status: CompanyStatus.VettingInProgress,
    };

    const previousPayload = JSON.stringify(originalCompany);

    const updatedCompany = {
      ...originalCompany,
      status: CompanyStatus.PendingUserActivation,
    };

    const currentUser = getCurrentUser({});

    const approveInput = {
      companyId: originalCompany.id,
    };

    describe('when the user is new to AKAMAI', () => {
      it('should update the company status', async () => {
        const saveAuditTrail = jest.fn();
        const save = jest.fn();
        const notifyNewAkamaiUserWelcome = jest.fn();
        const register = jest.fn();

        const companyUsers = [supplierEditorUserMock];

        const companyRepositoryMock = ({
          save,
          findOne: () => ({ ...originalCompany }),
        } as unknown) as Repository<CompanyEntity>;
        save.mockImplementation(() => updatedCompany);

        const userRepositoryMock = ({
          companyUsers: jest.fn(() => companyUsers),
        } as unknown) as UserRepository;

        const mockContext = ({
          user: currentUser,
          controllers: {
            audit: {
              saveAuditTrail,
            },
            user: {
              findAllByCompanyId: jest.fn(() => companyUsers),
            },
          },
          clients: {
            notification: {
              notifyNewAkamaiUserWelcome,
            },
            akamai: {
              register,
            },
          },
        } as unknown) as IContext;
        const controller = new CompanyController(
          companyRepositoryMock,
          userRepositoryMock,
          {} as CompanyService
        );

        const result = await controller.approveCompany(
          approveInput,
          mockContext
        );

        expect(result).toEqual(updatedCompany);
        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall).toEqual(
          expect.objectContaining({
            userId: currentUser.id,
            action: COMPANY_UPDATED_ACTION,
            currentPayload: JSON.stringify(updatedCompany),
            previousPayload,
          })
        );
        expect(notifyNewAkamaiUserWelcome).toHaveBeenCalledTimes(
          companyUsers.length
        );
      });
    });

    describe('when the user exists in AKAMAI', () => {
      it('should update the company status', async () => {
        const saveAuditTrail = jest.fn();
        const save = jest.fn();
        const notifyExistingAkamaiUserWelcome = jest.fn();
        const register = jest.fn();

        const companyUsers = [supplierEditorUserMock];

        const companyRepositoryMock = ({
          save,
          findOne: () => ({ ...originalCompany }),
        } as unknown) as Repository<CompanyEntity>;
        save.mockImplementation(() => updatedCompany);
        register.mockRejectedValue(new AkamaiUserAlreadyExistsError(''));

        const userRepositoryMock = ({
          companyUsers: jest.fn(() => companyUsers),
        } as unknown) as UserRepository;

        const mockContext = ({
          user: currentUser,
          controllers: {
            audit: {
              saveAuditTrail,
            },
            user: {
              findAllByCompanyId: jest.fn(() => companyUsers),
            },
          },
          clients: {
            notification: {
              notifyExistingAkamaiUserWelcome,
            },
            akamai: {
              register,
            },
          },
        } as unknown) as IContext;
        const controller = new CompanyController(
          companyRepositoryMock,
          userRepositoryMock,
          {} as CompanyService
        );

        const result = await controller.approveCompany(
          approveInput,
          mockContext
        );

        expect(result).toEqual(updatedCompany);
        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall).toEqual(
          expect.objectContaining({
            userId: currentUser.id,
            action: COMPANY_UPDATED_ACTION,
            currentPayload: JSON.stringify(updatedCompany),
            previousPayload,
          })
        );
        expect(notifyExistingAkamaiUserWelcome).toHaveBeenCalledTimes(
          companyUsers.length
        );
      });
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.InvitationDeclined}
      ${CompanyStatus.PendingUserActivation}
      ${CompanyStatus.Vetoed}
      ${CompanyStatus.PendingUserConfirmation}
    `(
      'when the current company status is $companyStatus',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should not permit the user to approve a company', async () => {
          const companyRepositoryMock = ({
            findOne: () => ({ ...originalCompany, status: companyStatus }),
          } as unknown) as Repository<CompanyEntity>;

          const mockContext = ({
            user: currentUser,
            controllers: {
              user: {
                findAllByCompanyId: jest.fn(() => []),
              },
            },
            clients: {
              akamai: { register: jest.fn() },
              notification: { notifyNewAkamaiUserWelcome: jest.fn() },
            },
          } as unknown) as IContext;

          const userRepositoryMock = ({
            companyUsers: jest.fn(() => []),
          } as unknown) as UserRepository;

          const controller = new CompanyController(
            companyRepositoryMock,
            userRepositoryMock,
            {} as CompanyService
          );

          try {
            await controller.approveCompany(approveInput, mockContext);
          } catch (err) {
            expect(err.message).toBe(COMPANY_STATUS_CHANGE_INVALID);
          }
        });
      }
    );
  });

  describe('companiesBenchmark', () => {
    it('calls the service to get the benchmark data', async () => {
      const companyId = 'company-id';
      const args = ({
        intensityMetric: 'NUMBER_OF_EMPLOYEES',
        limit: 10,
        offset: 1,
        order: 'ASC',
        orderBy: 'BASELINE_YEAR',
      } as unknown) as CompaniesBenchmarkInput;
      const context = {
        user: {
          companyId,
        },
      } as IContext;

      const getCompaniesBenchmark = jest.fn();

      const companyController = new CompanyController(
        ({} as unknown) as CompanyRepository,
        ({} as unknown) as UserRepository,
        ({ getCompaniesBenchmark } as unknown) as CompanyService
      );
      await companyController.companiesBenchmark(args, context);

      expect(getCompaniesBenchmark).toBeCalledWith(
        context.user.companyId,
        args
      );
    });
  });

  describe('companyProfile', () => {
    it('calls the service to get the company profile', async () => {
      const args = {
        companyId: 'another-company-id',
      };
      const context = {
        user: {
          companyId: 'user-company-id',
        },
      } as IContext;

      const getCompanyProfile = jest.fn();

      const companyController = new CompanyController(
        ({} as unknown) as CompanyRepository,
        ({} as unknown) as UserRepository,
        ({ getCompanyProfile } as unknown) as CompanyService
      );
      await companyController.companyProfile(args, context);

      expect(getCompanyProfile).toBeCalledWith(
        args.companyId,
        context.user.companyId
      );
    });
    it('throws an error if the user requests his company data', async () => {
      const userCompanyData = 'user-company-data';
      const args = {
        companyId: userCompanyData,
      };
      const context = {
        user: {
          companyId: userCompanyData,
        },
      } as IContext;

      const getCompanyProfile = jest.fn();

      const companyController = new CompanyController(
        ({} as unknown) as CompanyRepository,
        ({} as unknown) as UserRepository,
        ({ getCompanyProfile } as unknown) as CompanyService
      );
      expect(
        companyController.companyProfile(args, context)
      ).rejects.toThrowError(USER_COMPANY_CANNOT_ACCESS);
    });
  });
});
