import { v4 as uuidV4 } from 'uuid';
import { Repository } from 'typeorm';
import { IContext } from '../../apolloContext';

import {
  COMPANY_RELATIONSHIP_CREATED_ACTION,
  COMPANY_RELATIONSHIP_DELETED_ACTION,
} from '../../constants/audit';
import { getConectionApprovedTemplate } from '../../emailTemplates/connectionApproved';
import { getConectionRejectedTemplate } from '../../emailTemplates/connectionRejected';
import { getNewConnectionRequestTemplate } from '../../emailTemplates/newConnectionRequest';
import { CompanyEntity } from '../../entities/Company';
import {
  addJobSendEmailToQueue,
  addJobSendHubspotEmailToQueue,
} from '../../jobs/tasks/email/queue';
import { company2Mock, companyMock } from '../../mocks/company';
import {
  companyCustomerMock,
  companySupplierMock,
} from '../../mocks/companyRelationship';
import { supplierEditorUserMock } from '../../mocks/user';
import { Flags, getConfig } from '../../config';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import { CompanyRelationshipRepository } from '../../repositories/CompanyRelationshipRepository';
import { CompanyRelationshipService } from '../../services/CompanyRelationshipService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import { CompanyQuickConnectService } from '../../services/CompanyQuickConnectService';
import { SAndPClient } from '../../clients/SAndPClient';
import { createCompanyRelationshipRecommendationMock } from '../../mocks/companyRelationshipRecommendation';
import { CompanyRelationshipRecommendationRepository } from '../../repositories/CompanyRelationshipRecommendationRepository';
import {
  CompanyRelationship,
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
  CompanyStatus,
  InviteStatus,
  RoleName,
} from '../../types';
import {
  CANT_UPDATE_INVITE_STATUS,
  CompanyRelationshipController,
  COMPANY_RELATIONSHIP_CONNECTED_ERROR,
  COMPANY_RELATIONSHIP_PENDING_ERROR,
  COMPANY_RELATIONSHIP_REJECTED_ERROR,
  NO_COMPANIES_ERROR,
} from './';
import { ContextUser } from '../../entities/User';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';

jest.mock('../../emailTemplates/newConnectionRequest');
jest.mock('../../emailTemplates/connectionApproved');
jest.mock('../../emailTemplates/connectionRejected');
jest.mock('../../jobs/tasks/email/queue');
jest.mock('../../config', () => {
  const actual = jest.requireActual('../../config');
  return {
    ...actual,
    getConfig: jest.fn().mockReturnValue({ ...actual.getConfig(), flags: {} }),
  };
});

type CompanyRelationshipControllerFactoryArgs = {
  databaseService?: DatabaseService | Partial<DatabaseService>;
  relationshipRepository?:
    | CompanyRelationshipRepository
    | Partial<CompanyRelationshipRepository>;
  companyRepository?: CompanyRepository | Partial<CompanyRepository>;
  companyRelationshipService?:
    | CompanyRelationshipService
    | Partial<CompanyRelationshipService>;
  companyQuickConnectService?:
    | CompanyQuickConnectService
    | Partial<CompanyQuickConnectService>;
};

const companyRelationshipControllerFactory = ({
  databaseService = (jest.fn() as unknown) as DatabaseService,
  relationshipRepository = (jest.fn() as unknown) as CompanyRelationshipRepository,
  companyRepository = (jest.fn() as unknown) as Repository<CompanyEntity>,
  companyRelationshipService = (jest.fn() as unknown) as CompanyRelationshipService,
  companyQuickConnectService = (jest.fn() as unknown) as CompanyQuickConnectService,
}: CompanyRelationshipControllerFactoryArgs) => {
  return new CompanyRelationshipController(
    databaseService as DatabaseService,
    relationshipRepository as CompanyRelationshipRepository,
    companyRepository as CompanyRepository,
    companyRelationshipService as CompanyRelationshipService,
    companyQuickConnectService as CompanyQuickConnectService
  );
};

const recipients = [
  { email: 'hello@world.com' },
  { email: 'hello2@world.com' },
  { email: 'hello3@world.com' },
];

describe('CompanyRelationshipController', () => {
  const companyRelationshipRecommendationId = uuidV4();
  const findCompanies = jest.fn();
  const companyRepository: Partial<CompanyRepository> = {
    find: findCompanies,
  };

  const databaseService = ({
    transaction: (cb: () => void) => {
      cb();
    },
    setEntityManager: () => {
      return;
    },
  } as unknown) as DatabaseService;

  const networkSummaryMock = jest.spyOn(
    CompanyRelationshipService.prototype,
    'networkSummary'
  );
  const findManyMock = jest.spyOn(
    CompanyRelationshipService.prototype,
    'findMany'
  );
  const clearEntityManagerMock = jest.spyOn(
    CompanyRelationshipService.prototype,
    'clearEntityManager'
  );

  const companyRelationshipService = new CompanyRelationshipService(
    databaseService,
    CompanyRelationshipEntity
  );

  const findRecommendationMock = jest
    .spyOn(CompanyQuickConnectService.prototype, 'findRecommendation')
    .mockResolvedValue(undefined);

  const updateRecommendationMock = jest.spyOn(
    CompanyQuickConnectService.prototype,
    'updateRecommendation'
  );

  const sAndPClient = (jest.fn() as unknown) as SAndPClient;

  const companyQuickConnectService = new CompanyQuickConnectService(
    databaseService,
    sAndPClient,
    (jest.fn() as unknown) as CompanyRelationshipRecommendationRepository
  );

  const findRecipientCompanyUsers = jest.fn();
  findRecipientCompanyUsers.mockImplementation(() => []);
  (getNewConnectionRequestTemplate as jest.Mock).mockImplementation(() => ({
    template: 'hello',
    subject: 'hello',
  }));
  (getConectionApprovedTemplate as jest.Mock).mockImplementation(() => ({
    template: 'hello',
    subject: 'hello',
  }));
  (getConectionRejectedTemplate as jest.Mock).mockImplementation(() => ({
    template: 'hello',
    subject: 'hello',
  }));

  afterEach(() => {
    jest.clearAllMocks();
    findCompanies.mockImplementation(() => [companyMock, company2Mock]);
  });

  beforeEach(() => {
    (companyRepository.find as jest.Mock).mockClear();
    networkSummaryMock.mockReset();
    findManyMock.mockReset();
    clearEntityManagerMock.mockReset();
    findRecommendationMock.mockReset();
  });

  describe('findByCompanyId()', () => {
    const expected: [] = [];

    const mockContext = ({
      user: supplierEditorUserMock,
    } as unknown) as IContext;

    const controller = companyRelationshipControllerFactory({
      databaseService,
      companyRelationshipService,
      companyQuickConnectService,
    });

    describe('when user belongs to the company', () => {
      beforeEach(() => {
        findManyMock.mockResolvedValue(expected);
      });
      it('should return all relationships for a company', async () => {
        const result = await controller.findByCompanyId(
          { companyId: companyMock.id },
          mockContext
        );

        expect(findManyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: [
              { supplierId: companyMock.id },
              { customerId: companyMock.id },
            ],
          })
        );

        expect(result).toEqual(expected);
      });

      it('should return all customers for a company', async () => {
        const result = await controller.findByCompanyId(
          {
            companyId: companyMock.id,
            relationshipType: CompanyRelationshipType.Customer,
          },
          mockContext
        );

        expect(findManyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: [{ supplierId: companyMock.id }],
          })
        );

        expect(result).toEqual(expected);
      });

      it('should return all suppliers for a company', async () => {
        const result = await controller.findByCompanyId(
          {
            companyId: companyMock.id,
            relationshipType: CompanyRelationshipType.Supplier,
          },
          mockContext
        );

        expect(findManyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: [{ customerId: companyMock.id }],
          })
        );

        expect(result).toEqual(expected);
      });

      it('should return all suppliers given status for a company', async () => {
        const status = InviteStatus.Approved;
        const result = await controller.findByCompanyId(
          {
            companyId: companyMock.id,
            relationshipType: CompanyRelationshipType.Supplier,
            status,
          },
          mockContext
        );

        expect(findManyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: [{ status, customerId: companyMock.id }],
          })
        );

        expect(result).toEqual(expected);
      });

      it('should return all customers given status for a company', async () => {
        const status = InviteStatus.AwaitingSupplierApproval;
        const result = await controller.findByCompanyId(
          {
            companyId: companyMock.id,
            relationshipType: CompanyRelationshipType.Customer,
            status,
          },
          mockContext
        );

        expect(findManyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: [{ status, supplierId: companyMock.id }],
          })
        );

        expect(result).toEqual(expected);
      });

      it('should return all connections given status for a company', async () => {
        const status = InviteStatus.AwaitingSupplierApproval;
        const result = await controller.findByCompanyId(
          {
            companyId: companyMock.id,
            status,
          },
          mockContext
        );

        expect(findManyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: [
              { status, supplierId: companyMock.id },
              { status, customerId: companyMock.id },
            ],
          })
        );

        expect(result).toEqual(expected);
      });
    });

    describe.each`
      role
      ${RoleName.Admin}
    `('when current user is $role', ({ role }: { role: RoleName }) => {
      beforeEach(() => {
        findManyMock.mockResolvedValue(expected);
      });

      it('should return all relationships for a company', async () => {
        const result = await controller.findByCompanyId(
          { companyId: companyMock.id },
          {
            ...mockContext,
            user: {
              companyId: mockContext.user.companyId,
              roles: [{ name: role }],
            } as ContextUser,
          }
        );

        expect(findManyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            where: [
              { supplierId: companyMock.id },
              { customerId: companyMock.id },
            ],
          })
        );

        expect(result).toEqual(expected);
      });
    });

    describe('when the user is not an admin or support and they do not belong to the company', () => {
      it('should throw an error', async () => {
        try {
          await controller.findByCompanyId(
            { companyId: 'random_id' },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(USER_COMPANY_ERROR);
        }
      });
    });
  });

  describe('create()', () => {
    const findOne = jest.fn();
    const save = jest.fn();

    const relationshipRepositoryMock: Partial<CompanyRelationshipRepository> = {
      findOne,
      save,
    };
    const saveAuditTrail = jest.fn();

    const mockContext = ({
      user: supplierEditorUserMock,
      controllers: {
        audit: { saveAuditTrail },
        user: { findAllByCompanyId: findRecipientCompanyUsers },
      },
      clients: {
        hubspotEmail: {
          sendInviteCustomerEmail: jest.fn(),
          sendInviteSupplierEmail: jest.fn(),
        },
      },
    } as unknown) as IContext;

    const controller = companyRelationshipControllerFactory({
      relationshipRepository: relationshipRepositoryMock,
      companyRepository,
      companyRelationshipService,
      companyQuickConnectService,
    });

    beforeEach(() => {
      updateRecommendationMock.mockResolvedValue();
    });

    it('should allow a company to invite their supplier', async () => {
      findOne.mockImplementation(() => undefined);
      save.mockImplementation(() => companySupplierMock);

      const result = await controller.create(
        {
          inviteType: companySupplierMock.inviteType,
          customerId: companySupplierMock.customerId,
          supplierId: companySupplierMock.supplierId,
          note: companySupplierMock.note,
        },
        mockContext
      );

      expect(result).toBe(companySupplierMock);
      const [[saveAuditTrailCall]] = saveAuditTrail.mock.calls;
      expect(saveAuditTrailCall).toEqual(
        expect.objectContaining({
          userId: supplierEditorUserMock.id,
          action: COMPANY_RELATIONSHIP_CREATED_ACTION,
          currentPayload: JSON.stringify(companySupplierMock),
        })
      );
    });

    it('should allow a company to invite their customer', async () => {
      findOne.mockImplementation(() => undefined);
      save.mockImplementation(() => companyCustomerMock);
      findCompanies.mockImplementation(() => [companyMock, company2Mock]);

      const result = await controller.create(
        {
          inviteType: companyCustomerMock.inviteType,
          customerId: companyCustomerMock.customerId,
          supplierId: companyCustomerMock.supplierId,
          note: companyCustomerMock.note,
        },
        mockContext
      );

      expect(result).toBe(companyCustomerMock);
      const [[saveAuditTrailCall]] = saveAuditTrail.mock.calls;
      expect(saveAuditTrailCall).toEqual(
        expect.objectContaining({
          userId: supplierEditorUserMock.id,
          action: COMPANY_RELATIONSHIP_CREATED_ACTION,
          currentPayload: JSON.stringify(companyCustomerMock),
        })
      );
    });

    it('should acknowledge a company relationship recommendation where one exists', async () => {
      findRecommendationMock.mockResolvedValue(
        createCompanyRelationshipRecommendationMock({
          id: companyRelationshipRecommendationId,
          recommendationForCompanyId: companyMock.id,
          recommendedCompanyDuns: '88884444',
          nativeRelationshipType: companyCustomerMock.inviteType,
          recommendationStatus:
            CompanyRelationshipRecommendationStatus.Unacknowledged,
        })
      );
      findOne.mockImplementation(() => undefined);
      save.mockImplementation(() => companyCustomerMock);
      findCompanies.mockImplementation(() => [companyMock, company2Mock]);

      await controller.create(
        {
          inviteType: companyCustomerMock.inviteType,
          customerId: companyCustomerMock.customerId,
          supplierId: companyCustomerMock.supplierId,
          note: companyCustomerMock.note,
        },
        mockContext
      );
      expect(findRecommendationMock).toHaveBeenCalledWith({
        recommendationForCompanyId: companyMock.id,
        recommendedCompanyDuns: company2Mock.duns,
        relationshipType: companyCustomerMock.inviteType,
      });
      expect(updateRecommendationMock).toHaveBeenCalledWith({
        currentStatus: CompanyRelationshipRecommendationStatus.Unacknowledged,
        newStatus: CompanyRelationshipRecommendationStatus.Accepted,
        id: companyRelationshipRecommendationId,
        reviewedBy: supplierEditorUserMock.id,
      });
    });

    it('should only allow company create their own customer relationships', async () => {
      try {
        await controller.create(
          {
            inviteType: companyCustomerMock.inviteType,
            customerId: companyCustomerMock.customerId,
            supplierId: 'random_supplierId',
            note: companyCustomerMock.note,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should only allow company create their own supplier relationships', async () => {
      try {
        await controller.create(
          {
            inviteType: companySupplierMock.inviteType,
            customerId: 'random_customer_id',
            supplierId: companySupplierMock.supplierId,
            note: companySupplierMock.note,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    describe.each`
      status                                   | error                                   | mock
      ${InviteStatus.Approved}                 | ${COMPANY_RELATIONSHIP_CONNECTED_ERROR} | ${companySupplierMock}
      ${InviteStatus.AwaitingSupplierApproval} | ${COMPANY_RELATIONSHIP_PENDING_ERROR}   | ${companySupplierMock}
      ${InviteStatus.AwaitingCustomerApproval} | ${COMPANY_RELATIONSHIP_PENDING_ERROR}   | ${companyCustomerMock}
      ${InviteStatus.RejectedBySupplier}       | ${COMPANY_RELATIONSHIP_REJECTED_ERROR}  | ${companySupplierMock}
      ${InviteStatus.RejectedByCustomer}       | ${COMPANY_RELATIONSHIP_REJECTED_ERROR}  | ${companyCustomerMock}
    `(
      'when a relationship already exists with a "$status" status',
      ({
        status,
        error,
        mock,
      }: {
        status: InviteStatus;
        error: string;
        mock: CompanyRelationship;
      }) => {
        it('should not allow to create a relationship and should throw $error error', async () => {
          findOne.mockImplementation(() => ({
            ...mock,
            status,
          }));

          try {
            await controller.create(
              {
                inviteType: companySupplierMock.inviteType,
                customerId: companySupplierMock.customerId,
                supplierId: companySupplierMock.supplierId,
                note: companySupplierMock.note,
              },
              mockContext
            );
          } catch (err) {
            expect(err.message).toBe(error);
          }
        });
      }
    );

    it('should not allow to create a relationship for companies that do not exist', async () => {
      findOne.mockImplementation(() => undefined);
      findCompanies.mockImplementation(() => []);
      try {
        await controller.create(
          {
            inviteType: companySupplierMock.inviteType,
            customerId: companySupplierMock.customerId,
            supplierId: companySupplierMock.supplierId,
            note: companySupplierMock.note,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(NO_COMPANIES_ERROR);
      }
    });

    describe('when user represents a SUPPLIER', () => {
      describe.each`
        companyStatus
        ${CompanyStatus.Active}
        ${CompanyStatus.PendingUserActivation}
      `(
        'when company has $companyStatus',
        ({ companyStatus }: { companyStatus: CompanyStatus }) => {
          it('Mulesoft should send connection request emails to CUSTOMER editors', async () => {
            findCompanies.mockImplementation(() => [
              companyMock,
              { ...company2Mock, status: companyStatus },
            ]);
            findOne.mockImplementation(() => undefined);
            save.mockImplementation(() => companyCustomerMock);

            findRecipientCompanyUsers.mockImplementation(() => recipients);

            await controller.create(
              {
                inviteType: companyCustomerMock.inviteType,
                customerId: companyCustomerMock.customerId,
                supplierId: companyCustomerMock.supplierId,
                note: companyCustomerMock.note,
              },
              mockContext
            );

            const [
              [findRecipientCompanyUsersCall],
            ] = findRecipientCompanyUsers.mock.calls;
            expect(findRecipientCompanyUsersCall).toEqual({
              companyId: companyCustomerMock.customerId,
              roleNames: [RoleName.SupplierEditor],
            });

            expect(getNewConnectionRequestTemplate).toHaveBeenCalled();
            expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(
              recipients.length
            );
          });
          it('HubSpot should send connection request emails to CUSTOMER editors', async () => {
            (getConfig as jest.Mock).mockImplementationOnce(() => ({
              flags: {
                [Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED]: true,
              },
            }));
            findCompanies.mockImplementation(() => [
              companyMock,
              { ...company2Mock, status: companyStatus },
            ]);
            findOne.mockImplementation(() => undefined);
            save.mockImplementation(() => companyCustomerMock);

            findRecipientCompanyUsers.mockImplementation(() => recipients);

            await controller.create(
              {
                inviteType: companyCustomerMock.inviteType,
                customerId: companyCustomerMock.customerId,
                supplierId: companyCustomerMock.supplierId,
                note: companyCustomerMock.note,
              },
              mockContext
            );

            const [
              [findRecipientCompanyUsersCall],
            ] = findRecipientCompanyUsers.mock.calls;
            expect(findRecipientCompanyUsersCall).toEqual({
              companyId: companyCustomerMock.customerId,
              roleNames: [RoleName.SupplierEditor],
            });

            expect(
              mockContext.clients.hubspotEmail.sendInviteCustomerEmail
            ).toBeCalled();
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
        'when company has $companyStatus',
        ({ companyStatus }: { companyStatus: CompanyStatus }) => {
          it('should NOT send connection request emails to CUSTOMER editors', async () => {
            findCompanies.mockImplementation(() => [
              companyMock,
              { ...company2Mock, status: companyStatus },
            ]);
            findOne.mockImplementation(() => undefined);
            save.mockImplementation(() => companyCustomerMock);

            findRecipientCompanyUsers.mockImplementation(() => recipients);

            await controller.create(
              {
                inviteType: companyCustomerMock.inviteType,
                customerId: companyCustomerMock.customerId,
                supplierId: companyCustomerMock.supplierId,
                note: companyCustomerMock.note,
              },
              mockContext
            );

            expect(findRecipientCompanyUsers).not.toHaveBeenCalled();
            expect(getNewConnectionRequestTemplate).not.toHaveBeenCalled();
            expect(addJobSendHubspotEmailToQueue).not.toHaveBeenCalled();
            expect(addJobSendEmailToQueue).not.toHaveBeenCalled();
          });
        }
      );
    });

    describe('when user represents a CUSTOMER', () => {
      describe.each`
        companyStatus
        ${CompanyStatus.Active}
        ${CompanyStatus.PendingUserActivation}
      `(
        'when company has $companyStatus',
        ({ companyStatus }: { companyStatus: CompanyStatus }) => {
          it('Mulesoft should send connection request emails to SUPPLIER editors', async () => {
            findOne.mockImplementation(() => undefined);
            save.mockImplementation(() => companySupplierMock);
            findCompanies.mockImplementation(() => [
              { ...company2Mock, status: companyStatus },
              companyMock,
            ]);

            findRecipientCompanyUsers.mockImplementation(() => recipients);

            await controller.create(
              {
                inviteType: companySupplierMock.inviteType,
                customerId: companySupplierMock.customerId,
                supplierId: companySupplierMock.supplierId,
                note: companySupplierMock.note,
              },
              mockContext
            );

            const [
              [findRecipientCompanyUsersCall],
            ] = findRecipientCompanyUsers.mock.calls;
            expect(findRecipientCompanyUsersCall).toEqual({
              companyId: companySupplierMock.supplierId,
              roleNames: [RoleName.SupplierEditor],
            });

            expect(getNewConnectionRequestTemplate).toHaveBeenCalled();
            expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(
              recipients.length
            );
          });
          it('Hubspot should send connection request emails to SUPPLIER editors', async () => {
            (getConfig as jest.Mock).mockImplementationOnce(() => ({
              flags: {
                [Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED]: true,
              },
            }));
            findOne.mockImplementation(() => undefined);
            save.mockImplementation(() => companySupplierMock);
            findCompanies.mockImplementation(() => [
              { ...company2Mock, status: companyStatus },
              companyMock,
            ]);

            findRecipientCompanyUsers.mockImplementation(() => recipients);

            await controller.create(
              {
                inviteType: companySupplierMock.inviteType,
                customerId: companySupplierMock.customerId,
                supplierId: companySupplierMock.supplierId,
                note: companySupplierMock.note,
              },
              mockContext
            );

            const [
              [findRecipientCompanyUsersCall],
            ] = findRecipientCompanyUsers.mock.calls;
            expect(findRecipientCompanyUsersCall).toEqual({
              companyId: companySupplierMock.supplierId,
              roleNames: [RoleName.SupplierEditor],
            });

            expect(
              mockContext.clients.hubspotEmail.sendInviteSupplierEmail
            ).toBeCalled();
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
        'when company has $companyStatus',
        ({ companyStatus }: { companyStatus: CompanyStatus }) => {
          it('should NOT send connection request emails to SUPPLIER editors', async () => {
            findOne.mockImplementation(() => undefined);
            save.mockImplementation(() => companySupplierMock);
            findCompanies.mockImplementation(() => [
              { ...company2Mock, status: companyStatus },
              companyMock,
            ]);

            findRecipientCompanyUsers.mockImplementation(() => recipients);

            await controller.create(
              {
                inviteType: companySupplierMock.inviteType,
                customerId: companySupplierMock.customerId,
                supplierId: companySupplierMock.supplierId,
                note: companySupplierMock.note,
              },
              mockContext
            );

            expect(findRecipientCompanyUsers).not.toHaveBeenCalled();
            expect(getNewConnectionRequestTemplate).not.toHaveBeenCalled();
            expect(addJobSendHubspotEmailToQueue).not.toHaveBeenCalled();
            expect(addJobSendEmailToQueue).not.toHaveBeenCalled();
          });
        }
      );
    });
  });

  describe('update()', () => {
    const findOne = jest.fn();
    const save = jest.fn();
    const relationshipRepositoryMock: Partial<CompanyRelationshipRepository> = ({
      findOne,
      save,
    } as unknown) as CompanyRelationshipRepository;
    const saveAuditTrail = jest.fn();
    const mockContext = ({
      user: supplierEditorUserMock,
      controllers: {
        audit: { saveAuditTrail },
        user: { findAllByCompanyId: findRecipientCompanyUsers },
      },
      clients: {
        hubspotEmail: {
          sendInviteCustomerEmail: jest.fn(),
          sendInviteSupplierEmail: jest.fn(),
          sendCustomerInvitationApprovedEmail: jest.fn(),
          sendSupplierInvitationApprovedEmail: jest.fn(),
          sendCustomerInvitationDeclinedEmail: jest.fn(),
          sendSupplierInvitationDeclinedEmail: jest.fn(),
        },
      },
    } as unknown) as IContext;

    const controller = companyRelationshipControllerFactory({
      relationshipRepository: relationshipRepositoryMock,
      companyRepository,
      companyRelationshipService,
    });

    describe('when user represents a CUSTOMER', () => {
      it.each`
        currentStatus                            | newStatus
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.Approved}
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.RejectedByCustomer}       | ${InviteStatus.Approved}
        ${InviteStatus.RejectedBySupplier}       | ${InviteStatus.AwaitingSupplierApproval}
      `(
        'should be able to update status from "$currentStatus" to "$newStatus"',
        async ({
          currentStatus,
          newStatus,
        }: {
          currentStatus: InviteStatus;
          newStatus: InviteStatus;
        }) => {
          const relationship = {
            ...companySupplierMock,
            supplierApproverId: null,
            customerApproverId: null,
            status: currentStatus,
            inviteType: CompanyRelationshipType.Customer,
          };

          const updates = {
            id: relationship.id,
            status: newStatus,
          };

          const expected = {
            ...relationship,
            ...updates,
          };

          findOne.mockImplementation(() => ({
            ...relationship,
            supplier: company2Mock,
            customer: companyMock,
          }));
          save.mockImplementation(() => expected);

          expect.assertions(1);

          const result = await controller.update(updates, mockContext);
          expect(result).toEqual(expected);
        }
      );
      it.each`
        currentStatus                            | newStatus
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.Approved}
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.RejectedBySupplier}
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.AwaitingCustomerApproval}
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.AwaitingSupplierApproval}
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.RejectedBySupplier}
        ${InviteStatus.RejectedBySupplier}       | ${InviteStatus.Approved}
        ${InviteStatus.RejectedBySupplier}       | ${InviteStatus.AwaitingCustomerApproval}
        ${InviteStatus.RejectedBySupplier}       | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.RejectedByCustomer}       | ${InviteStatus.AwaitingCustomerApproval}
        ${InviteStatus.RejectedByCustomer}       | ${InviteStatus.RejectedBySupplier}
        ${InviteStatus.Approved}                 | ${InviteStatus.AwaitingSupplierApproval}
        ${InviteStatus.Approved}                 | ${InviteStatus.AwaitingCustomerApproval}
        ${InviteStatus.Approved}                 | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.Approved}                 | ${InviteStatus.RejectedBySupplier}
      `(
        'should NOT be able to update status from "$currentStatus" to "$newStatus"',
        async ({
          currentStatus,
          newStatus,
        }: {
          currentStatus: InviteStatus;
          newStatus: InviteStatus;
        }) => {
          const relationship = {
            ...companySupplierMock,
            customerId: mockContext.user.companyId,
            supplierApproverId: null,
            customerApproverId: null,
            status: currentStatus,
            inviteType: CompanyRelationshipType.Customer,
          };

          findOne.mockImplementation(() => relationship);
          findOne.mockImplementation(() => ({
            ...relationship,
            supplier: company2Mock,
            customer: companyMock,
          }));

          expect.assertions(1);
          try {
            await controller.update(
              { id: relationship.id, status: newStatus },
              mockContext
            );
          } catch (err) {
            expect(err.message).toBe(CANT_UPDATE_INVITE_STATUS);
          }
        }
      );

      it('Mulesoft should send connection approved emails to SUPPLIER editors', async () => {
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companySupplierMock,
          supplierId: company2Mock.id,
          customerId: companyMock.id,
          status: InviteStatus.AwaitingCustomerApproval,
          inviteType: CompanyRelationshipType.Customer,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.Approved,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: company2Mock,
          customer: companyMock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(getConectionApprovedTemplate).toHaveBeenCalled();
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('Hubspot should send connection approved emails to SUPPLIER editors', async () => {
        (getConfig as jest.Mock).mockImplementationOnce(() => ({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]: true,
          },
        }));
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companySupplierMock,
          supplierId: company2Mock.id,
          customerId: companyMock.id,
          status: InviteStatus.AwaitingCustomerApproval,
          inviteType: CompanyRelationshipType.Customer,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.Approved,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: company2Mock,
          customer: companyMock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(
          mockContext.clients.hubspotEmail.sendCustomerInvitationApprovedEmail
        ).toBeCalled();
      });

      it('Mulesoft should send connection rejected emails to SUPPLIER editors', async () => {
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companySupplierMock,
          supplierId: company2Mock.id,
          customerId: companyMock.id,
          status: InviteStatus.AwaitingCustomerApproval,
          inviteType: CompanyRelationshipType.Customer,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.RejectedByCustomer,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: company2Mock,
          customer: companyMock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(getConectionRejectedTemplate).toHaveBeenCalled();
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('Hubspot should send connection rejected emails to SUPPLIER editors', async () => {
        (getConfig as jest.Mock).mockImplementationOnce(() => ({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]: true,
          },
        }));
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companySupplierMock,
          supplierId: company2Mock.id,
          customerId: companyMock.id,
          status: InviteStatus.AwaitingCustomerApproval,
          inviteType: CompanyRelationshipType.Customer,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.RejectedByCustomer,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: company2Mock,
          customer: companyMock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(
          mockContext.clients.hubspotEmail.sendCustomerInvitationDeclinedEmail
        ).toBeCalled();
      });

      it('Mulesoft should re-send new connection emails to SUPPLIER editors', async () => {
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companySupplierMock,
          supplierId: company2Mock.id,
          customerId: companyMock.id,
          status: InviteStatus.RejectedBySupplier,
          inviteType: CompanyRelationshipType.Supplier,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.AwaitingSupplierApproval,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: company2Mock,
          customer: companyMock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(getNewConnectionRequestTemplate).toHaveBeenCalled();
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('Hubspot should re-send new connection emails to SUPPLIER editors', async () => {
        (getConfig as jest.Mock).mockImplementationOnce(() => ({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]: true,
          },
        }));
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companySupplierMock,
          supplierId: company2Mock.id,
          customerId: companyMock.id,
          status: InviteStatus.RejectedBySupplier,
          inviteType: CompanyRelationshipType.Supplier,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.AwaitingSupplierApproval,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: company2Mock,
          customer: companyMock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(
          mockContext.clients.hubspotEmail.sendInviteSupplierEmail
        ).toBeCalled();
      });
    });

    describe('when user represents a SUPPLIER', () => {
      it.each`
        currentStatus                            | newStatus
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.Approved}
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.RejectedBySupplier}
        ${InviteStatus.RejectedBySupplier}       | ${InviteStatus.Approved}
        ${InviteStatus.RejectedByCustomer}       | ${InviteStatus.AwaitingCustomerApproval}
      `(
        'should be able to update status from "$currentStatus" to "$newStatus"',
        async ({
          currentStatus,
          newStatus,
        }: {
          currentStatus: InviteStatus;
          newStatus: InviteStatus;
        }) => {
          const relationship = {
            ...companyCustomerMock,
            supplierApproverId: null,
            customerApproverId: null,
            status: currentStatus,
            inviteType: CompanyRelationshipType.Supplier,
          };

          const updates = {
            id: relationship.id,
            status: newStatus,
          };

          const expected = {
            ...relationship,
            ...updates,
          };

          findOne.mockImplementation(() => relationship);
          findOne.mockImplementation(() => ({
            ...relationship,
            supplier: company2Mock,
            customer: companyMock,
          }));
          save.mockImplementation(() => expected);

          expect.assertions(1);

          const result = await controller.update(updates, mockContext);

          expect(result).toEqual(expected);
        }
      );

      it.each`
        currentStatus                            | newStatus
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.Approved}
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.AwaitingSupplierApproval}
        ${InviteStatus.AwaitingCustomerApproval} | ${InviteStatus.RejectedBySupplier}
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.AwaitingCustomerApproval}
        ${InviteStatus.AwaitingSupplierApproval} | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.RejectedByCustomer}       | ${InviteStatus.Approved}
        ${InviteStatus.RejectedByCustomer}       | ${InviteStatus.AwaitingSupplierApproval}
        ${InviteStatus.RejectedByCustomer}       | ${InviteStatus.RejectedBySupplier}
        ${InviteStatus.RejectedBySupplier}       | ${InviteStatus.AwaitingSupplierApproval}
        ${InviteStatus.RejectedBySupplier}       | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.Approved}                 | ${InviteStatus.AwaitingSupplierApproval}
        ${InviteStatus.Approved}                 | ${InviteStatus.AwaitingCustomerApproval}
        ${InviteStatus.Approved}                 | ${InviteStatus.RejectedByCustomer}
        ${InviteStatus.Approved}                 | ${InviteStatus.RejectedBySupplier}
      `(
        'should NOT be able to update status from "$currentStatus" to "$newStatus"',
        async ({
          currentStatus,
          newStatus,
        }: {
          currentStatus: InviteStatus;
          newStatus: InviteStatus;
        }) => {
          const relationship = {
            ...companyCustomerMock,
            supplierId: mockContext.user.companyId,
            supplierApproverId: null,
            customerApproverId: null,
            status: currentStatus,
            inviteType: CompanyRelationshipType.Supplier,
          };

          findOne.mockImplementation(() => relationship);
          findOne.mockImplementation(() => ({
            ...relationship,
            supplier: company2Mock,
            customer: companyMock,
          }));

          expect.assertions(1);
          try {
            await controller.update(
              { id: relationship.id, status: newStatus },
              mockContext
            );
          } catch (err) {
            expect(err.message).toBe(CANT_UPDATE_INVITE_STATUS);
          }
        }
      );

      it('Mulesoft should send connection approved emails to CUSTOMER editors', async () => {
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companyCustomerMock,
          supplierApproverId: null,
          customerApproverId: null,
          supplierId: companyMock.id,
          customerId: company2Mock.id,
          status: InviteStatus.AwaitingSupplierApproval,
          inviteType: CompanyRelationshipType.Supplier,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.Approved,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: companyMock,
          customer: company2Mock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(getConectionApprovedTemplate).toHaveBeenCalled();
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('Hubspot should send connection approved emails to CUSTOMER editors', async () => {
        (getConfig as jest.Mock).mockImplementationOnce(() => ({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]: true,
          },
        }));
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companyCustomerMock,
          supplierApproverId: null,
          customerApproverId: null,
          supplierId: companyMock.id,
          customerId: company2Mock.id,
          status: InviteStatus.AwaitingSupplierApproval,
          inviteType: CompanyRelationshipType.Supplier,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.Approved,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: companyMock,
          customer: company2Mock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(
          mockContext.clients.hubspotEmail.sendSupplierInvitationApprovedEmail
        ).toBeCalled();
      });

      it('MuleSoft should send connection rejected emails to CUSTOMER editors', async () => {
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companyCustomerMock,
          supplierApproverId: null,
          customerApproverId: null,
          supplierId: companyMock.id,
          customerId: company2Mock.id,
          status: InviteStatus.AwaitingSupplierApproval,
          inviteType: CompanyRelationshipType.Supplier,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.RejectedBySupplier,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: companyMock,
          customer: company2Mock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(getConectionRejectedTemplate).toHaveBeenCalled();
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('Hubspot should send connection rejected emails to CUSTOMER editors', async () => {
        (getConfig as jest.Mock).mockImplementationOnce(() => ({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]: true,
          },
        }));
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companyCustomerMock,
          supplierApproverId: null,
          customerApproverId: null,
          supplierId: companyMock.id,
          customerId: company2Mock.id,
          status: InviteStatus.AwaitingSupplierApproval,
          inviteType: CompanyRelationshipType.Supplier,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.RejectedBySupplier,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: companyMock,
          customer: company2Mock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(
          mockContext.clients.hubspotEmail.sendSupplierInvitationDeclinedEmail
        ).toBeCalled();
      });

      it('Mulesoft should re-send invite emails to CUSTOMER editors', async () => {
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companyCustomerMock,
          supplierApproverId: null,
          customerApproverId: null,
          supplierId: companyMock.id,
          customerId: company2Mock.id,
          status: InviteStatus.RejectedByCustomer,
          inviteType: CompanyRelationshipType.Customer,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.AwaitingCustomerApproval,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: companyMock,
          customer: company2Mock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(getNewConnectionRequestTemplate).toHaveBeenCalled();
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('Hubspot should re-send invite emails to CUSTOMER editors', async () => {
        (getConfig as jest.Mock).mockImplementationOnce(() => ({
          flags: {
            [Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]: true,
          },
        }));
        findOne.mockImplementation(() => undefined);
        save.mockImplementation(() => companyCustomerMock);

        findRecipientCompanyUsers.mockImplementation(() => recipients);

        const relationship = {
          ...companyCustomerMock,
          supplierApproverId: null,
          customerApproverId: null,
          supplierId: companyMock.id,
          customerId: company2Mock.id,
          status: InviteStatus.RejectedByCustomer,
          inviteType: CompanyRelationshipType.Customer,
        };

        const updates = {
          id: relationship.id,
          status: InviteStatus.AwaitingCustomerApproval,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: companyMock,
          customer: company2Mock,
        }));
        save.mockImplementation(() => ({
          ...relationship,
          ...updates,
        }));

        await controller.update(updates, mockContext);

        expect(findRecipientCompanyUsers).toHaveBeenCalledWith(
          {
            companyId: company2Mock.id,
            roleNames: [RoleName.SupplierEditor],
          },
          expect.any(Object)
        );

        expect(
          mockContext.clients.hubspotEmail.sendInviteCustomerEmail
        ).toBeCalled();
      });
    });

    describe('when user does not belong to either supplier or customer', () => {
      it('should throw an error', async () => {
        const relationship = {
          ...companyCustomerMock,
          customerId: 'random_customer_id',
          supplierId: 'random_supplier_id',
          inviteType: CompanyRelationshipType.Customer,
        };

        findOne.mockImplementation(() => relationship);
        findOne.mockImplementation(() => ({
          ...relationship,
          supplier: company2Mock,
          customer: companyMock,
        }));

        expect.assertions(1);
        try {
          await controller.update(
            {
              id: relationship.id,
              status: InviteStatus.AwaitingSupplierApproval,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(USER_COMPANY_ERROR);
        }
      });
    });
  });

  describe('deleteAllByCompanyId()', () => {
    const deleteMock = jest.fn();
    const relationshipRepositoryMock = ({
      delete: deleteMock,
    } as unknown) as CompanyRelationshipRepository;
    const saveAuditTrails = jest.fn();

    const mockContext = ({
      user: supplierEditorUserMock,
      controllers: {
        audit: { saveAuditTrails },
      },
    } as unknown) as IContext;

    const controller = companyRelationshipControllerFactory({
      databaseService,
      relationshipRepository: relationshipRepositoryMock,
      companyRepository,
      companyRelationshipService,
      companyQuickConnectService,
    });

    it('should delete all company relationships', async () => {
      const relationships = [
        (companySupplierMock as unknown) as CompanyRelationshipEntity,
        (companyCustomerMock as unknown) as CompanyRelationshipEntity,
      ];
      findManyMock.mockResolvedValue(relationships);

      const result = await controller.deleteAllByCompanyId(
        { companyId: supplierEditorUserMock.companyId },
        mockContext
      );

      expect(deleteMock).toHaveBeenCalledWith([
        relationships[0].id,
        relationships[1].id,
      ]);

      const [[auditCall]] = saveAuditTrails.mock.calls;
      expect(auditCall.auditTrails).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: COMPANY_RELATIONSHIP_DELETED_ACTION,
            userId: supplierEditorUserMock.id,
            previousPayload: JSON.stringify(relationships[0]),
          }),
          expect.objectContaining({
            action: COMPANY_RELATIONSHIP_DELETED_ACTION,
            userId: supplierEditorUserMock.id,
            previousPayload: JSON.stringify(relationships[1]),
          }),
        ])
      );
      expect(result).toEqual(relationships);
    });
  });

  describe('networkSummary()', () => {
    it('should pass the company ID from the user context', async () => {
      const companyId = 'a-company-id';
      const controller = companyRelationshipControllerFactory({
        databaseService,
        relationshipRepository: (jest.fn() as unknown) as CompanyRelationshipRepository,
        companyRepository: (companyRepository as unknown) as Repository<CompanyEntity>,
        companyRelationshipService,
        companyQuickConnectService,
      });

      const context = ({
        user: {
          ...supplierEditorUserMock,
          companyId,
        },
      } as unknown) as IContext;

      await controller.networkSummary({}, context);

      expect(networkSummaryMock).toHaveBeenCalledWith(companyId);
    });
  });
});
