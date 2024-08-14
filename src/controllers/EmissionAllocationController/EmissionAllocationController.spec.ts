import faker from 'faker';
import { Repository } from 'typeorm';
import {
  ALLOCATION_DOES_NOT_EXIST,
  ALLOCATION_EXISTS,
  CANNOT_ASSIGN_EMISSION,
  DELETE_NOT_ALLOWED,
  EmissionAllocationController,
  INVALID_STATUS_CHANGE,
  MISSING_FIELDS,
  NO_COMPANY_RELATIONSHIP_ERROR,
  NO_EMISSION_ERROR,
} from '.';
import { IContext } from '../../apolloContext';
import {
  EMISSION_ALLOCATION_CREATED_ACTION,
  EMISSION_ALLOCATION_DELETED_ACTION,
  EMISSION_ALLOCATION_UPDATED_ACTION,
} from '../../constants/audit';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { cat1Mock } from '../../mocks/category';
import { companyMock } from '../../mocks/company';
import { baselineMock } from '../../mocks/emission';
import {
  emissionAllocationSentBySupplier,
  emissionAllocationSentByMe,
  externalEmissionAllocation,
  emissionAllocationRequestedByMe,
} from '../../mocks/emissionAllocation';
import { supplierEditorUserMock } from '../../mocks/user';
import {
  EmissionAllocationDirection,
  EmissionAllocationMethod,
  EmissionAllocationStatus,
  EmissionAllocationType,
} from '../../types';
import { addJobSendEmailToQueue } from '../../jobs/tasks/email/queue';
import { getAllocationSubmissionTemplate } from '../../emailTemplates/allocationSubmission';
import { getAllocationApprovedTemplate } from '../../emailTemplates/allocationApproved';
import { getAllocationRejectedTemplate } from '../../emailTemplates/allocationRejected';
import { getAllocationDeletedTemplate } from '../../emailTemplates/allocationDeleted';
import { getAllocationUpdatedTemplate } from '../../emailTemplates/allocationUpdated';
import { getAllocationRequestedTemplate } from '../../emailTemplates/allocationRequested';
import { hubspotEmail } from '../../clients/HubspotEmailClient';
import { Flags, getConfig } from '../../config';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';

jest.mock('../../emailTemplates/allocationSubmission');
jest.mock('../../emailTemplates/allocationApproved');
jest.mock('../../emailTemplates/allocationRejected');
jest.mock('../../emailTemplates/allocationDeleted');
jest.mock('../../emailTemplates/allocationUpdated');
jest.mock('../../emailTemplates/allocationRequested');
jest.mock('../../jobs/tasks/email/queue');
jest.mock('../../clients/HubspotEmailClient');
jest.mock('../../config', () => {
  const actual = jest.requireActual('../../config');
  return {
    ...actual,
    getConfig: jest.fn().mockReturnValue({ ...actual.getConfig(), flags: {} }),
  };
});

describe('EmissionAllocationController', () => {
  ((getAllocationApprovedTemplate as unknown) as jest.Mock).mockImplementation(
    () => ({
      template: '',
      subject: '',
    })
  );

  ((getAllocationSubmissionTemplate as unknown) as jest.Mock).mockImplementation(
    () => ({
      template: '',
      subject: '',
    })
  );

  ((getAllocationRejectedTemplate as unknown) as jest.Mock).mockImplementation(
    () => ({
      template: '',
      subject: '',
    })
  );

  ((getAllocationDeletedTemplate as unknown) as jest.Mock).mockImplementation(
    () => ({
      template: '',
      subject: '',
    })
  );

  ((getAllocationUpdatedTemplate as unknown) as jest.Mock).mockImplementation(
    () => ({
      template: '',
      subject: '',
    })
  );

  ((getAllocationRequestedTemplate as unknown) as jest.Mock).mockImplementation(
    () => ({
      template: '',
      subject: '',
    })
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByCompanyId()', () => {
    const expected: [] = [];

    const find = jest.fn();
    const save = jest.fn();
    const allocationRepository = ({
      find,
      save,
    } as unknown) as Repository<EmissionAllocationEntity>;
    find.mockImplementation(() => expected);

    const relationshipRepository = (jest.fn() as unknown) as Repository<CompanyRelationshipEntity>;

    const emissionRepository = (jest.fn() as unknown) as Repository<CorporateEmissionEntity>;

    const mockContext = ({
      user: supplierEditorUserMock,
      clients: {
        hubspotEmail,
      },
    } as unknown) as IContext;

    const controller = new EmissionAllocationController(
      allocationRepository,
      relationshipRepository,
      emissionRepository
    );

    it('should return all allocations for a company', async () => {
      const result = await controller.findByCompanyId(
        { companyId: companyMock.id },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { supplierId: companyMock.id },
            { customerId: companyMock.id },
          ],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all allocations shared with customers', async () => {
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          emissionAllocation:
            EmissionAllocationDirection.EmissionAllocatedToCustomers,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ supplierId: companyMock.id }],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all allocations shared by suppliers', async () => {
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          emissionAllocation:
            EmissionAllocationDirection.EmissionAllocatedBySuppliers,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ customerId: companyMock.id }],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all allocations shared by suppliers with a given status', async () => {
      const statuses = [EmissionAllocationStatus.AwaitingApproval];
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          emissionAllocation:
            EmissionAllocationDirection.EmissionAllocatedBySuppliers,
          statuses,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            {
              status: {
                _multipleParameters: true,
                _type: 'in',
                _useParameter: true,
                _value: statuses,
              },
              customerId: companyMock.id,
            },
          ],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all allocations shared with customers with a given status', async () => {
      const statuses = [EmissionAllocationStatus.AwaitingApproval];
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          emissionAllocation:
            EmissionAllocationDirection.EmissionAllocatedToCustomers,
          statuses,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            {
              status: {
                _multipleParameters: true,
                _type: 'in',
                _useParameter: true,
                _value: statuses,
              },
              supplierId: companyMock.id,
            },
          ],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all allocations given status for a company', async () => {
      const statuses = [EmissionAllocationStatus.AwaitingApproval];
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          statuses,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            {
              status: {
                _multipleParameters: true,
                _type: 'in',
                _useParameter: true,
                _value: statuses,
              },
              supplierId: companyMock.id,
            },
            {
              status: {
                _multipleParameters: true,
                _type: 'in',
                _useParameter: true,
                _value: statuses,
              },
              customerId: companyMock.id,
            },
          ],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all allocations given a year for a company', async () => {
      const year = 2020;
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          year,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { year, supplierId: companyMock.id },
            { year, customerId: companyMock.id },
          ],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all allocations shared with customers with a given year', async () => {
      const year = 2019;
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          emissionAllocation:
            EmissionAllocationDirection.EmissionAllocatedToCustomers,
          year,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ year, supplierId: companyMock.id }],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should return all supplier allocations with a given year', async () => {
      const year = 2019;
      const result = await controller.findByCompanyId(
        {
          companyId: companyMock.id,
          emissionAllocation:
            EmissionAllocationDirection.EmissionAllocatedBySuppliers,
          year,
        },
        mockContext
      );

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ year, customerId: companyMock.id }],
        })
      );

      expect(result).toEqual(expected);
    });

    it('should throw an error if the user does not belong to the company', async () => {
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

  describe('emissionsAllocatedToMyCompany', () => {
    it('should return all emissions allocated to my company ordered by the years', async () => {
      const mockResult = [{ id: 'allocation-id' }];
      const emissionAllocationRepository = ({
        find: jest.fn().mockResolvedValue([{ id: 'allocation-id' }]),
      } as unknown) as Repository<EmissionAllocationEntity>;
      const args = { supplierId: 'supplier-id' };
      const mockContext = {
        user: {
          companyId: 'user-company-id',
        },
      } as IContext;
      const controller = new EmissionAllocationController(
        emissionAllocationRepository,
        {} as Repository<CompanyRelationshipEntity>,
        {} as Repository<CorporateEmissionEntity>
      );
      const result = await controller.emissionsAllocatedToMyCompany(
        args,
        mockContext
      );

      expect(emissionAllocationRepository.find).toHaveBeenCalledWith({
        where: {
          status: EmissionAllocationStatus.Approved,
          customerId: mockContext.user.companyId,
          supplierId: args.supplierId,
          type: EmissionAllocationType.Scope_3,
        },
        order: { year: 'ASC' },
      });

      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    const findOne = jest.fn();
    const save = jest.fn();
    const allocationRepository = ({
      findOne,
      save,
    } as unknown) as Repository<EmissionAllocationEntity>;

    const findRelationship = jest.fn();
    const relationshipRepository = ({
      findOne: findRelationship,
    } as unknown) as Repository<CompanyRelationshipEntity>;

    const findEmission = jest.fn();
    const emissionRepository = ({
      findOne: findEmission,
    } as unknown) as Repository<CorporateEmissionEntity>;

    const saveAuditTrail = jest.fn();
    const findRecipients = jest.fn();
    const findSenderCompany = jest.fn();
    const mockContext = ({
      user: supplierEditorUserMock,
      controllers: {
        audit: {
          saveAuditTrail,
        },
        user: {
          findAllByCompanyId: findRecipients,
        },
        company: {
          findById: findSenderCompany,
        },
      },
      clients: {
        hubspotEmail,
      },
    } as unknown) as IContext;

    const controller = new EmissionAllocationController(
      allocationRepository,
      relationshipRepository,
      emissionRepository
    );

    beforeEach(() => {
      findOne.mockImplementation(() => undefined);
      save.mockImplementation(() => emissionAllocationSentByMe);
      findRelationship.mockImplementation(() => ({ id: 'ID' }));
      findEmission.mockImplementation(() => ({
        ...baselineMock,
        year: emissionAllocationSentByMe.year,
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('when user represents a supplier', () => {
      beforeEach(() => {
        save.mockImplementation(() => emissionAllocationSentByMe);
      });

      it('should be able to create an emission allocation', async () => {
        const result = await controller.create(
          {
            supplierId: emissionAllocationSentByMe.supplierId,
            customerId: emissionAllocationSentByMe.customerId,
            year: emissionAllocationSentByMe.year,
            emissions: emissionAllocationSentByMe.emissions,
            supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
            allocationMethod: emissionAllocationSentByMe.allocationMethod,
          },
          mockContext
        );

        expect(result).toEqual(emissionAllocationSentByMe);

        expect(save).toHaveBeenCalledWith({
          supplierId: emissionAllocationSentByMe.supplierId,
          customerId: emissionAllocationSentByMe.customerId,
          year: emissionAllocationSentByMe.year,
          emissions: emissionAllocationSentByMe.emissions,
          supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
          status: EmissionAllocationStatus.AwaitingApproval,
          supplierApproverId: mockContext.user.id,
          type: EmissionAllocationType.Scope_3,
          allocationMethod: emissionAllocationSentByMe.allocationMethod,
        });

        expect(saveAuditTrail).toHaveBeenCalledWith(
          {
            userId: mockContext.user.id,
            action: EMISSION_ALLOCATION_CREATED_ACTION,
            currentPayload: JSON.stringify(emissionAllocationSentByMe),
          },
          expect.any(Object)
        );
      });

      it("should use Mulesoft to notify a customer's editors of the new allocation", async () => {
        const recipients = [{ email: 'a' }, { email: 'b' }];
        findRecipients.mockImplementationOnce(() => recipients);
        const senderCompany = { name: 'Name Ltd' };
        findSenderCompany.mockImplementationOnce(() => senderCompany);

        await controller.create(
          {
            supplierId: emissionAllocationSentByMe.supplierId,
            customerId: emissionAllocationSentByMe.customerId,
            year: emissionAllocationSentByMe.year,
            emissions: emissionAllocationSentByMe.emissions,
            supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
            allocationMethod: emissionAllocationSentByMe.allocationMethod,
          },
          mockContext
        );

        expect(getAllocationSubmissionTemplate).toHaveBeenCalledWith({
          supplierName: senderCompany.name,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/pending-requests`,
          allocationYear: emissionAllocationSentByMe.year,
        });
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it("should use Hubspot to notify customer's editors of the new allocation", async () => {
        (getConfig as jest.Mock).mockReturnValueOnce({
          flags: {
            [Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]: true,
          },
        });
        const recipients = [{ email: 'a' }, { email: 'b' }];
        findRecipients.mockImplementationOnce(() => recipients);
        const senderCompany = { name: 'Name Ltd' };
        findSenderCompany.mockImplementationOnce(() => senderCompany);

        await controller.create(
          {
            supplierId: emissionAllocationSentByMe.supplierId,
            customerId: emissionAllocationSentByMe.customerId,
            year: emissionAllocationSentByMe.year,
            emissions: emissionAllocationSentByMe.emissions,
            supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
            allocationMethod: emissionAllocationSentByMe.allocationMethod,
          },
          mockContext
        );

        expect(
          mockContext.clients.hubspotEmail.sendEmissionAllocationSubmittedEmail
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            supplierCompanyName: senderCompany.name,
            emissionYear: String(emissionAllocationSentByMe.year),
          })
        );
        expect(
          mockContext.clients.hubspotEmail.sendEmissionAllocationSubmittedEmail
        ).toBeCalledTimes(recipients.length);
      });

      it('should throw an error when customer relationship does not exist', async () => {
        findRelationship.mockImplementation(() => undefined);
        expect.assertions(1);
        try {
          await controller.create(
            {
              supplierId: emissionAllocationSentByMe.supplierId,
              customerId: emissionAllocationSentByMe.customerId,
              year: emissionAllocationSentByMe.year,
              emissions: emissionAllocationSentByMe.emissions,
              supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
              allocationMethod: emissionAllocationSentByMe.allocationMethod,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(NO_COMPANY_RELATIONSHIP_ERROR);
        }
      });

      it('should throw an error when allocation already exists for the year', async () => {
        findOne.mockImplementation(() => ({ id: 'ID' }));
        expect.assertions(1);
        try {
          await controller.create(
            {
              supplierId: emissionAllocationSentByMe.supplierId,
              customerId: emissionAllocationSentByMe.customerId,
              year: emissionAllocationSentByMe.year,
              emissions: emissionAllocationSentByMe.emissions,
              supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
              allocationMethod: emissionAllocationSentByMe.allocationMethod,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(ALLOCATION_EXISTS);
        }
      });

      it('should throw an error when supplierEmissionId is not provided', async () => {
        expect.assertions(1);
        try {
          await controller.create(
            {
              supplierId: emissionAllocationSentByMe.supplierId,
              customerId: emissionAllocationSentByMe.customerId,
              year: emissionAllocationSentByMe.year,
              emissions: emissionAllocationSentByMe.emissions,
              allocationMethod: emissionAllocationSentByMe.allocationMethod,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(MISSING_FIELDS);
        }
      });

      it('should throw an error when emissions is not provided', async () => {
        expect.assertions(1);
        try {
          await controller.create(
            {
              supplierId: emissionAllocationSentByMe.supplierId,
              customerId: emissionAllocationSentByMe.customerId,
              year: emissionAllocationSentByMe.year,
              supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
              allocationMethod: emissionAllocationSentByMe.allocationMethod,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(MISSING_FIELDS);
        }
      });

      it('should throw an error when emission for provided supplierEmissionId does not exist', async () => {
        expect.assertions(1);
        findEmission.mockImplementationOnce(() => undefined);
        try {
          await controller.create(
            {
              supplierId: emissionAllocationSentByMe.supplierId,
              customerId: emissionAllocationSentByMe.customerId,
              year: emissionAllocationSentByMe.year,
              emissions: emissionAllocationSentByMe.emissions,
              supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
              allocationMethod: emissionAllocationSentByMe.allocationMethod,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(NO_EMISSION_ERROR);
        }
      });

      it('should throw an error when the year of supplier emission is not the same as the allocation', async () => {
        expect.assertions(1);
        findEmission.mockImplementationOnce(() => ({
          ...baselineMock,
          year: emissionAllocationSentByMe.year + 1,
        }));
        try {
          await controller.create(
            {
              supplierId: emissionAllocationSentByMe.supplierId,
              customerId: emissionAllocationSentByMe.customerId,
              year: emissionAllocationSentByMe.year,
              emissions: emissionAllocationSentByMe.emissions,
              supplierEmissionId: emissionAllocationSentByMe.supplierEmissionId,
              allocationMethod: emissionAllocationSentByMe.allocationMethod,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(CANNOT_ASSIGN_EMISSION);
        }
      });
    });

    describe('when user represents a customer', () => {
      beforeEach(() => {
        save.mockImplementation(() => emissionAllocationSentBySupplier);
      });

      it('should create an emission allocation', async () => {
        const result = await controller.create(
          {
            supplierId: emissionAllocationSentBySupplier.supplierId,
            customerId: emissionAllocationSentBySupplier.customerId,
            year: emissionAllocationSentBySupplier.year,
            note: emissionAllocationSentBySupplier.note,
          },
          mockContext
        );

        expect(result).toEqual(emissionAllocationSentBySupplier);

        expect(save).toHaveBeenCalledWith({
          supplierId: emissionAllocationSentBySupplier.supplierId,
          customerId: emissionAllocationSentBySupplier.customerId,
          year: emissionAllocationSentBySupplier.year,
          status: EmissionAllocationStatus.Requested,
          customerApproverId: mockContext.user.id,
          type: EmissionAllocationType.Scope_3,
          note: emissionAllocationSentBySupplier.note,
        });

        expect(saveAuditTrail).toHaveBeenCalledWith(
          {
            userId: mockContext.user.id,
            action: EMISSION_ALLOCATION_CREATED_ACTION,
            currentPayload: JSON.stringify(emissionAllocationSentBySupplier),
          },
          expect.any(Object)
        );
      });

      it('should use Mulesoft to notify the supplier', async () => {
        const recipients = [
          { email: 'hello@world.com' },
          { email: 'hello2@world.com' },
          { email: 'hello3@world.com' },
        ];
        findRecipients.mockImplementation(() => recipients);

        const company = { name: 'Some name ltd' };
        findSenderCompany.mockImplementation(() => company);
        controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

        await controller.create(
          {
            supplierId: emissionAllocationSentBySupplier.supplierId,
            customerId: emissionAllocationSentBySupplier.customerId,
            year: emissionAllocationSentBySupplier.year,
            note: emissionAllocationSentBySupplier.note,
          },
          mockContext
        );

        expect(getAllocationRequestedTemplate).toHaveBeenCalledWith({
          customerName: company.name,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/pending-requests`,
          allocationYear: emissionAllocationSentBySupplier.year,
        });

        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('should use Hubspot to notify the supplier', async () => {
        (getConfig as jest.Mock).mockReturnValueOnce({
          flags: {
            [Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]: true,
          },
        });
        const recipients = [
          { email: 'hello@world.com' },
          { email: 'hello2@world.com' },
          { email: 'hello3@world.com' },
        ];
        findRecipients.mockImplementation(() => recipients);

        const company = { name: 'Some name ltd' };
        findSenderCompany.mockImplementation(() => company);
        controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

        await controller.create(
          {
            supplierId: emissionAllocationSentBySupplier.supplierId,
            customerId: emissionAllocationSentBySupplier.customerId,
            year: emissionAllocationSentBySupplier.year,
            note: emissionAllocationSentBySupplier.note,
          },
          mockContext
        );

        expect(
          mockContext.clients.hubspotEmail.sendEmissionAllocationRequestEmail
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            customerCompanyName: company.name,
            emissionYear: String(emissionAllocationSentBySupplier.year),
          })
        );

        expect(
          mockContext.clients.hubspotEmail.sendEmissionAllocationRequestEmail
        ).toHaveBeenCalledTimes(recipients.length);
      });
    });

    it('should throw an error when supplier relationship does not exist', async () => {
      findRelationship.mockImplementation(() => undefined);
      expect.assertions(1);
      try {
        await controller.create(
          {
            supplierId: emissionAllocationSentBySupplier.supplierId,
            customerId: emissionAllocationSentBySupplier.customerId,
            year: emissionAllocationSentBySupplier.year,
            emissions: emissionAllocationSentBySupplier.emissions,
            supplierEmissionId:
              emissionAllocationSentBySupplier.supplierEmissionId,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(NO_COMPANY_RELATIONSHIP_ERROR);
      }
    });

    it('should throw an error when allocation already exists for the year', async () => {
      findOne.mockImplementation(() => ({ id: 'ID' }));
      expect.assertions(1);
      try {
        await controller.create(
          {
            supplierId: emissionAllocationSentBySupplier.supplierId,
            customerId: emissionAllocationSentBySupplier.customerId,
            year: emissionAllocationSentBySupplier.year,
            emissions: emissionAllocationSentBySupplier.emissions,
            supplierEmissionId:
              emissionAllocationSentBySupplier.supplierEmissionId,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(ALLOCATION_EXISTS);
      }
    });

    describe('when an external users tries to allocate on behalf of other companies', () => {
      it('should throw an error', async () => {
        expect.assertions(1);
        try {
          await controller.create(
            {
              supplierId: externalEmissionAllocation.supplierId,
              customerId: externalEmissionAllocation.customerId,
              year: externalEmissionAllocation.year,
              emissions: externalEmissionAllocation.emissions,
              supplierEmissionId: externalEmissionAllocation.supplierEmissionId,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(USER_COMPANY_ERROR);
        }
      });
    });

    it('should throw an error', async () => {
      expect.assertions(1);
      try {
        await controller.create(
          {
            supplierId: externalEmissionAllocation.supplierId,
            customerId: externalEmissionAllocation.customerId,
            year: externalEmissionAllocation.year,
            emissions: externalEmissionAllocation.emissions,
            supplierEmissionId: externalEmissionAllocation.supplierEmissionId,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });
  });

  describe('update', () => {
    const findOne = jest.fn();
    const save = jest.fn();
    const allocationRepository = ({
      findOne,
      save,
      manager: {
        transaction: jest.fn(),
      },
    } as unknown) as Repository<EmissionAllocationEntity>;

    const findRelationship = jest.fn();
    const relationshipRepository = ({
      findOne: findRelationship,
    } as unknown) as Repository<CompanyRelationshipEntity>;

    const findEmission = jest.fn();
    const emissionRepository = ({
      findOne: findEmission,
    } as unknown) as Repository<CorporateEmissionEntity>;

    const saveAuditTrail = jest.fn();
    const findRecipients = jest.fn();
    const findSenderCompany = jest.fn();
    const mockContext = ({
      user: supplierEditorUserMock,
      controllers: {
        audit: {
          saveAuditTrail,
        },
        user: {
          findAllByCompanyId: findRecipients,
        },
        company: {
          findById: findSenderCompany,
        },
      },
      clients: {
        hubspotEmail,
      },
    } as unknown) as IContext;

    const controller = new EmissionAllocationController(
      allocationRepository,
      relationshipRepository,
      emissionRepository
    );

    beforeEach(() => {
      findRelationship.mockImplementation(() => ({ id: 'ID' }));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('when user represents a supplier', () => {
      const update = {
        id: emissionAllocationSentByMe.id,
        emissions: 9999999,
        allocationMethod: EmissionAllocationMethod.Other,
        supplierEmissionId: baselineMock.id,
        status: EmissionAllocationStatus.AwaitingApproval,
      };

      const allocation = {
        ...emissionAllocationSentByMe,
        status: EmissionAllocationStatus.Requested,
      };

      const updatedAllocation = {
        ...allocation,
        ...update,
        supplierApproverId: mockContext.user.id.toUpperCase(),
      };

      beforeEach(() => {
        findOne.mockImplementation(() => ({ ...allocation }));
        save.mockImplementation(() => updatedAllocation);
        findEmission.mockImplementation(() => ({
          ...baselineMock,
          year: emissionAllocationSentByMe.year,
        }));
      });

      it('should update allocation', async () => {
        controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();
        const result = await controller.update(update, mockContext);

        expect(result).toEqual(updatedAllocation);

        expect(
          controller.saveAllocationAndUpdateCustomerScope3
        ).toHaveBeenCalledWith(
          {
            allocation: updatedAllocation,
            previousAllocation: allocation,
          },
          expect.any(Object)
        );

        const [[audit]] = saveAuditTrail.mock.calls;

        expect(audit.userId).toEqual(mockContext.user.id);
        expect(audit.action).toEqual(EMISSION_ALLOCATION_UPDATED_ACTION);
        expect(JSON.parse(audit.previousPayload)).toEqual(allocation);
        expect(JSON.parse(audit.currentPayload)).toEqual(updatedAllocation);
      });

      it('should use Mulesoft to notify a customer when allocation was REQUESTED previously', async () => {
        const recipients = [
          { email: 'hello@world.com' },
          { email: 'hello2@world.com' },
          { email: 'hello3@world.com' },
        ];
        findRecipients.mockImplementation(() => recipients);

        const company = { name: 'Some name ltd' };
        findSenderCompany.mockImplementation(() => company);
        controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();
        await controller.update(update, mockContext);

        expect(getAllocationSubmissionTemplate).toHaveBeenCalledWith({
          supplierName: company.name,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/pending-requests`,
          allocationYear: allocation.year,
        });
        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('should use Hubspot to notify a customer when allocation was REQUESTED previously', async () => {
        (getConfig as jest.Mock).mockReturnValueOnce({
          flags: {
            [Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]: true,
          },
        });
        const recipients = [
          { email: 'hello@world.com' },
          { email: 'hello2@world.com' },
          { email: 'hello3@world.com' },
        ];
        findRecipients.mockImplementation(() => recipients);

        const company = { name: 'Some name ltd' };
        findSenderCompany.mockImplementation(() => company);
        controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();
        await controller.update(update, mockContext);

        expect(
          mockContext.clients.hubspotEmail.sendEmissionAllocationSubmittedEmail
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            supplierCompanyName: company.name,
            emissionYear: String(allocation.year),
          })
        );
        expect(
          mockContext.clients.hubspotEmail.sendEmissionAllocationSubmittedEmail
        ).toBeCalledTimes(recipients.length);
      });

      it('should notify supplier when an allocation is updated not in response to a request', async () => {
        const update = {
          id: emissionAllocationSentByMe.id,
          emissions: 100000,
          allocationMethod: EmissionAllocationMethod.Other,
          supplierEmissionId: baselineMock.id,
        };

        const allocation = {
          ...emissionAllocationSentByMe,
          status: EmissionAllocationStatus.Approved,
        };
        findOne.mockImplementation(() => allocation);

        const recipients = [
          { email: 'hello@world.com' },
          { email: 'hello2@world.com' },
          { email: 'hello3@world.com' },
        ];
        findRecipients.mockImplementation(() => recipients);

        const company = { name: 'Some name ltd' };
        findSenderCompany.mockImplementation(() => company);
        controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

        await controller.update(update, mockContext);

        expect(getAllocationUpdatedTemplate).toHaveBeenCalledWith({
          supplierName: company.name,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/pending-requests`,
          allocationYear: allocation.year,
        });

        expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(recipients.length);
      });

      it('should throw an error when allocation does not exist', async () => {
        findOne.mockImplementation(() => undefined);
        expect.assertions(1);
        try {
          await controller.update(update, mockContext);
        } catch (err) {
          expect(err.message).toBe(ALLOCATION_DOES_NOT_EXIST);
        }
      });

      it('should throw when emissions is missing from input', async () => {
        expect.assertions(1);
        try {
          await controller.update(
            {
              ...update,
              emissions: null,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(MISSING_FIELDS);
        }
      });

      it('should throw when supplierEmissionId is missing from input', async () => {
        expect.assertions(1);
        try {
          await controller.update(
            {
              ...update,
              supplierEmissionId: null,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toBe(MISSING_FIELDS);
        }
      });

      it('should throw when supplierEmissionId is missing from input', async () => {
        findEmission.mockImplementation(() => undefined);
        expect.assertions(1);
        try {
          await controller.update(update, mockContext);
        } catch (err) {
          expect(err.message).toBe(NO_EMISSION_ERROR);
        }
      });

      it('should throw when supplierEmissionId is for an emission not within the same year', async () => {
        findEmission.mockImplementation(() => baselineMock);
        expect.assertions(1);
        try {
          await controller.update(update, mockContext);
        } catch (err) {
          expect(err.message).toBe(CANNOT_ASSIGN_EMISSION);
        }
      });

      it('should allow to dismiss a customer request', async () => {
        const update = {
          id: emissionAllocationSentByMe.id,
          status: EmissionAllocationStatus.RequestDismissed,
        };

        const allocation = {
          ...emissionAllocationSentByMe,
          status: EmissionAllocationStatus.Requested,
        };
        findOne.mockImplementation(() => allocation);

        controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

        const updatedAllocation = await controller.update(update, mockContext);

        expect(updatedAllocation.status).toEqual(update.status);

        expect(addJobSendEmailToQueue).not.toHaveBeenCalled();
      });
    });

    describe('when user represents a customer', () => {
      const allocation = {
        ...emissionAllocationSentBySupplier,
        status: EmissionAllocationStatus.AwaitingApproval,
      };

      beforeEach(() => {
        findOne.mockImplementation(() => ({ ...allocation }));
        findEmission.mockImplementation(() => ({
          ...baselineMock,
          year: emissionAllocationSentBySupplier.year,
        }));
      });

      describe('when accepting an allocation', () => {
        it('should update allocation', async () => {
          const update = {
            id: emissionAllocationSentBySupplier.id,
            categoryId: faker.random.uuid(),
            customerEmissionId: baselineMock.id,
            status: EmissionAllocationStatus.Approved,
            note: 'new note',
          };

          const updatedAllocation = {
            ...allocation,
            ...update,
            customerApproverId: mockContext.user.id.toUpperCase(),
          };

          save.mockImplementation(() => updatedAllocation);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

          const result = await controller.update(update, mockContext);

          expect(result).toEqual(updatedAllocation);

          expect(
            controller.saveAllocationAndUpdateCustomerScope3
          ).toHaveBeenCalledWith(
            {
              allocation: updatedAllocation,
              previousAllocation: allocation,
            },
            expect.any(Object)
          );

          const [[audit]] = saveAuditTrail.mock.calls;

          expect(audit.userId).toEqual(mockContext.user.id);
          expect(audit.action).toEqual(EMISSION_ALLOCATION_UPDATED_ACTION);
          expect(JSON.parse(audit.previousPayload)).toEqual(allocation);
          expect(JSON.parse(audit.currentPayload)).toEqual(updatedAllocation);
        });

        it('should use Mulesoft to notify a supplier when allocation is APPROVED', async () => {
          const update = {
            id: emissionAllocationSentBySupplier.id,
            categoryId: faker.random.uuid(),
            customerEmissionId: baselineMock.id,
            status: EmissionAllocationStatus.Approved,
          };

          const recipients = [
            { email: 'hello@world.com' },
            { email: 'hello2@world.com' },
            { email: 'hello3@world.com' },
          ];
          findRecipients.mockImplementation(() => recipients);

          const company = { name: 'Some name ltd' };
          findSenderCompany.mockImplementation(() => company);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

          await controller.update(update, mockContext);

          expect(getAllocationApprovedTemplate).toHaveBeenCalledWith({
            customerName: company.name,
            ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/customers`,
            allocationYear: allocation.year,
          });
          expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(
            recipients.length
          );
        });

        it('should use Hubspot to notify a supplier when allocation is APPROVED', async () => {
          (getConfig as jest.Mock).mockReturnValueOnce({
            flags: {
              [Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]: true,
            },
          });
          const update = {
            id: emissionAllocationSentBySupplier.id,
            categoryId: faker.random.uuid(),
            customerEmissionId: baselineMock.id,
            status: EmissionAllocationStatus.Approved,
          };

          const recipients = [
            { email: 'hello@world.com' },
            { email: 'hello2@world.com' },
            { email: 'hello3@world.com' },
          ];
          findRecipients.mockImplementation(() => recipients);

          const company = { name: 'Some name ltd' };
          findSenderCompany.mockImplementation(() => company);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

          await controller.update(update, mockContext);

          expect(
            mockContext.clients.hubspotEmail.sendEmissionAllocationAcceptedEmail
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              customerCompanyName: company.name,
              emissionYear: String(allocation.year),
            })
          );
          expect(
            mockContext.clients.hubspotEmail.sendEmissionAllocationAcceptedEmail
          ).toBeCalledTimes(recipients.length);
        });

        it('should Mulesoft notify supplier when allocation is REJECTED', async () => {
          const update = {
            id: emissionAllocationSentBySupplier.id,
            status: EmissionAllocationStatus.Rejected,
          };

          const recipients = [
            { email: 'hello@world.com' },
            { email: 'hello2@world.com' },
            { email: 'hello3@world.com' },
          ];
          findRecipients.mockImplementation(() => recipients);

          const company = { name: 'Some name ltd' };
          findSenderCompany.mockImplementation(() => company);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();
          await controller.update(update, mockContext);

          expect(getAllocationRejectedTemplate).toHaveBeenCalledWith({
            customerName: company.name,
            ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/customers`,
            allocationYear: allocation.year,
          });
          expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(
            recipients.length
          );
        });

        it('should Hubspot notify supplier when allocation is REJECTED', async () => {
          (getConfig as jest.Mock).mockReturnValueOnce({
            flags: {
              [Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]: true,
            },
          });

          const update = {
            id: emissionAllocationSentBySupplier.id,
            status: EmissionAllocationStatus.Rejected,
          };

          const recipients = [
            { email: 'hello@world.com' },
            { email: 'hello2@world.com' },
            { email: 'hello3@world.com' },
          ];
          findRecipients.mockImplementation(() => recipients);

          const company = { name: 'Some name ltd' };
          findSenderCompany.mockImplementation(() => company);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();
          await controller.update(update, mockContext);

          expect(
            mockContext.clients.hubspotEmail.sendEmissionAllocationRejectedEmail
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              customerCompanyName: company.name,
              emissionYear: String(allocation.year),
            })
          );
          expect(
            mockContext.clients.hubspotEmail.sendEmissionAllocationRejectedEmail
          ).toHaveBeenCalledTimes(recipients.length);
        });

        it('should throw an error when categoryId was not provided', async () => {
          const update = {
            id: emissionAllocationSentBySupplier.id,
            customerEmissionId: baselineMock.id,
            status: EmissionAllocationStatus.Approved,
          };

          expect.assertions(1);
          try {
            await controller.update(update, mockContext);
          } catch (err) {
            expect(err.message).toBe(MISSING_FIELDS);
          }
        });

        it('should throw an error when customerEmissionId was not provided', async () => {
          const update = {
            id: emissionAllocationSentBySupplier.id,
            categoryId: faker.random.uuid(),
            status: EmissionAllocationStatus.Approved,
          };

          expect.assertions(1);
          try {
            await controller.update(update, mockContext);
          } catch (err) {
            expect(err.message).toBe(MISSING_FIELDS);
          }
        });

        it('should throw an error if allocation does not exist', async () => {
          findOne.mockImplementationOnce(() => undefined);
          const update = {
            id: emissionAllocationSentBySupplier.id,
            customerEmissionId: baselineMock.id,
            status: EmissionAllocationStatus.Approved,
          };

          expect.assertions(1);
          try {
            await controller.update(update, mockContext);
          } catch (err) {
            expect(err.message).toBe(ALLOCATION_DOES_NOT_EXIST);
          }
        });

        it('should throw when provided customer emission does not exists', async () => {
          findEmission.mockImplementationOnce(() => undefined);
          const update = {
            id: emissionAllocationSentBySupplier.id,
            customerEmissionId: baselineMock.id,
            categoryId: faker.random.uuid(),
            status: EmissionAllocationStatus.Approved,
          };

          expect.assertions(1);
          try {
            await controller.update(update, mockContext);
          } catch (err) {
            expect(err.message).toBe(NO_EMISSION_ERROR);
          }
        });

        it('should throw when provided customer emission is not for the same year', async () => {
          findEmission.mockImplementationOnce(() => ({
            ...baselineMock,
            year: emissionAllocationSentBySupplier.year + 1,
          }));
          const update = {
            id: emissionAllocationSentBySupplier.id,
            customerEmissionId: baselineMock.id,
            categoryId: faker.random.uuid(),
            status: EmissionAllocationStatus.Approved,
          };

          expect.assertions(1);
          try {
            await controller.update(update, mockContext);
          } catch (err) {
            expect(err.message).toBe(CANNOT_ASSIGN_EMISSION);
          }
        });
      });

      describe('when rejecting an allocation', () => {
        it('should update allocation', async () => {
          const update = {
            id: emissionAllocationSentBySupplier.id,
            status: EmissionAllocationStatus.Rejected,
          };

          const updatedAllocation = {
            ...allocation,
            ...update,
            customerApproverId: mockContext.user.id.toUpperCase(),
          };

          save.mockImplementation(() => updatedAllocation);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

          const result = await controller.update(update, mockContext);

          expect(result).toEqual(updatedAllocation);

          expect(
            controller.saveAllocationAndUpdateCustomerScope3
          ).toHaveBeenCalledWith(
            {
              allocation: updatedAllocation,
              previousAllocation: allocation,
            },
            expect.any(Object)
          );

          const [[audit]] = saveAuditTrail.mock.calls;

          expect(audit.userId).toEqual(mockContext.user.id);
          expect(audit.action).toEqual(EMISSION_ALLOCATION_UPDATED_ACTION);
          expect(JSON.parse(audit.previousPayload)).toEqual(allocation);
          expect(JSON.parse(audit.currentPayload)).toEqual(updatedAllocation);
        });

        it('should throw an error if allocation does not exist', async () => {
          findOne.mockImplementationOnce(() => undefined);
          const update = {
            id: emissionAllocationSentBySupplier.id,
            customerEmissionId: baselineMock.id,
            status: EmissionAllocationStatus.Rejected,
          };

          expect.assertions(1);
          try {
            await controller.update(update, mockContext);
          } catch (err) {
            expect(err.message).toBe(ALLOCATION_DOES_NOT_EXIST);
          }
        });
      });

      describe('when re-requesting a dismissed allocation', () => {
        it('should update the allocation', async () => {
          const dismissedAllocation = {
            ...allocation,
            status: EmissionAllocationStatus.RequestDismissed,
          };

          findOne.mockImplementationOnce(() => ({ ...dismissedAllocation }));

          const update = {
            id: emissionAllocationSentBySupplier.id,
            status: EmissionAllocationStatus.Requested,
          };

          const updatedAllocation = {
            ...dismissedAllocation,
            ...update,
            customerApproverId: mockContext.user.id.toUpperCase(),
          };

          save.mockImplementation(() => updatedAllocation);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

          const result = await controller.update(update, mockContext);

          expect(result).toEqual(updatedAllocation);

          expect(
            controller.saveAllocationAndUpdateCustomerScope3
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              allocation: updatedAllocation,
              previousAllocation: dismissedAllocation,
            }),
            expect.any(Object)
          );

          const [[audit]] = saveAuditTrail.mock.calls;

          expect(audit.userId).toEqual(mockContext.user.id);
          expect(audit.action).toEqual(EMISSION_ALLOCATION_UPDATED_ACTION);
          expect(JSON.parse(audit.previousPayload)).toEqual(
            dismissedAllocation
          );
          expect(JSON.parse(audit.currentPayload)).toEqual(updatedAllocation);
        });
      });

      describe('when requesting after rejecting an allocation', () => {
        it('should update the allocation', async () => {
          const rejectedAllocation = {
            ...allocation,
            status: EmissionAllocationStatus.Rejected,
          };

          findOne.mockImplementationOnce(() => ({ ...rejectedAllocation }));

          const update = {
            id: emissionAllocationSentBySupplier.id,
            status: EmissionAllocationStatus.Requested,
          };

          const updatedAllocation = {
            ...rejectedAllocation,
            ...update,
            customerApproverId: mockContext.user.id.toUpperCase(),
          };

          save.mockImplementation(() => updatedAllocation);
          controller.saveAllocationAndUpdateCustomerScope3 = jest.fn();

          const result = await controller.update(update, mockContext);

          expect(result).toEqual(updatedAllocation);

          expect(
            controller.saveAllocationAndUpdateCustomerScope3
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              allocation: updatedAllocation,
              previousAllocation: rejectedAllocation,
            }),
            expect.any(Object)
          );

          const [[audit]] = saveAuditTrail.mock.calls;

          expect(audit.userId).toEqual(mockContext.user.id);
          expect(audit.action).toEqual(EMISSION_ALLOCATION_UPDATED_ACTION);
          expect(JSON.parse(audit.previousPayload)).toEqual(rejectedAllocation);
          expect(JSON.parse(audit.currentPayload)).toEqual(updatedAllocation);
        });
      });

      it.each`
        currentStatus                                | nextStatus
        ${EmissionAllocationStatus.Approved}         | ${EmissionAllocationStatus.Requested}
        ${EmissionAllocationStatus.Approved}         | ${EmissionAllocationStatus.AwaitingApproval}
        ${EmissionAllocationStatus.Rejected}         | ${EmissionAllocationStatus.AwaitingApproval}
        ${EmissionAllocationStatus.Rejected}         | ${EmissionAllocationStatus.Approved}
        ${EmissionAllocationStatus.AwaitingApproval} | ${EmissionAllocationStatus.Requested}
        ${EmissionAllocationStatus.Requested}        | ${EmissionAllocationStatus.AwaitingApproval}
        ${EmissionAllocationStatus.Requested}        | ${EmissionAllocationStatus.Approved}
        ${EmissionAllocationStatus.Requested}        | ${EmissionAllocationStatus.Rejected}
        ${EmissionAllocationStatus.RequestDismissed} | ${EmissionAllocationStatus.Approved}
      `(
        'should throw an error when changing status from $currentStatus to $nextStatus',
        async ({
          currentStatus,
          nextStatus,
        }: {
          currentStatus: EmissionAllocationStatus;
          nextStatus: EmissionAllocationStatus;
        }) => {
          findOne.mockImplementationOnce(() => ({
            ...emissionAllocationSentBySupplier,
            status: currentStatus,
          }));

          const update = {
            id: emissionAllocationSentBySupplier.id,
            categoryId: cat1Mock.id,
            customerEmissionId: baselineMock.id,
            status: nextStatus,
          };

          expect.assertions(1);
          try {
            await controller.update(update, mockContext);
          } catch (err) {
            expect(err.message).toBe(INVALID_STATUS_CHANGE);
          }
        }
      );
    });

    describe('when external user', () => {
      const update = {
        id: emissionAllocationSentByMe.id,
        emissions: 9999999,
        allocationMethod: EmissionAllocationMethod.Other,
        supplierEmissionId: baselineMock.id,
        status: EmissionAllocationStatus.AwaitingApproval,
      };

      it('should throw when tries to update allocations', async () => {
        const externalMockContext = ({
          user: { ...supplierEditorUserMock, companyId: 'RANDOM_ID' },
          controllers: {
            audit: {
              saveAuditTrail,
            },
          },
        } as unknown) as IContext;

        expect.assertions(1);
        try {
          await controller.update(update, externalMockContext);
        } catch (err) {
          expect(err.message).toBe(USER_COMPANY_ERROR);
        }
      });
    });
  });

  describe('delete', () => {
    const findOne = jest.fn();
    const deleteAllocation = jest.fn();
    const allocationRepository = ({
      findOne,
      delete: deleteAllocation,
      manager: {
        transaction: jest.fn(),
      },
    } as unknown) as Repository<EmissionAllocationEntity>;

    const relationshipRepository = (jest.fn() as unknown) as Repository<CompanyRelationshipEntity>;

    const emissionRepository = (jest.fn() as unknown) as Repository<CorporateEmissionEntity>;

    const saveAuditTrail = jest.fn();
    const findRecipients = jest.fn();
    const findSenderCompany = jest.fn();
    const mockContext = ({
      user: supplierEditorUserMock,
      controllers: {
        audit: {
          saveAuditTrail,
        },
        user: {
          findAllByCompanyId: findRecipients,
        },
        company: {
          findById: findSenderCompany,
        },
      },
      clients: {
        hubspotEmail,
      },
    } as unknown) as IContext;

    const controller = new EmissionAllocationController(
      allocationRepository,
      relationshipRepository,
      emissionRepository
    );

    beforeEach(() => {
      findOne.mockImplementation(() => emissionAllocationSentByMe);
      controller.deleteAllocationAndUpdateCustomerScope3 = jest.fn();
    });

    describe('when user represents a supplier', () => {
      it('should allow user to delete an allocation', async () => {
        const result = await controller.delete(
          {
            id: emissionAllocationSentByMe.id,
          },
          mockContext
        );
        expect(result).toEqual(emissionAllocationSentByMe.id);
        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall.userId).toBe(mockContext.user.id);
        expect(auditCall.action).toBe(EMISSION_ALLOCATION_DELETED_ACTION);
        expect(JSON.parse(auditCall.previousPayload)).toEqual(
          emissionAllocationSentByMe
        );
        expect(
          controller.deleteAllocationAndUpdateCustomerScope3
        ).toHaveBeenCalled();
      });

      describe('when allocation has been approved', () => {
        it('should Mulesoft notify customer SUPPLIER_EDITORs of the deleted allocation', async () => {
          findOne.mockImplementation(() => ({
            ...emissionAllocationSentByMe,
            status: EmissionAllocationStatus.Approved,
          }));
          const recipients = [{ email: 'a' }, { email: 'b' }];
          findRecipients.mockImplementationOnce(() => recipients);
          const senderCompany = { name: 'Name Ltd' };
          findSenderCompany.mockImplementationOnce(() => senderCompany);

          await controller.delete(
            {
              id: emissionAllocationSentByMe.id,
            },
            mockContext
          );

          expect(getAllocationDeletedTemplate).toHaveBeenCalledWith({
            supplierName: senderCompany.name,
            ctaLink: `${process.env.WEB_APP_BASE_URL}/dashboard`,
            allocationYear: emissionAllocationSentByMe.year,
            emissions: emissionAllocationSentByMe.emissions,
          });
          expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(
            recipients.length
          );
        });

        it('should Hubspot notify customer SUPPLIER_EDITORs of the deleted allocation', async () => {
          (getConfig as jest.Mock).mockReturnValueOnce({
            flags: {
              [Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]: true,
            },
          });
          findOne.mockImplementation(() => ({
            ...emissionAllocationSentByMe,
            status: EmissionAllocationStatus.Approved,
          }));
          const recipients = [{ email: 'a' }, { email: 'b' }];
          findRecipients.mockImplementationOnce(() => recipients);
          const senderCompany = { name: 'Name Ltd' };
          findSenderCompany.mockImplementationOnce(() => senderCompany);

          await controller.delete(
            {
              id: emissionAllocationSentByMe.id,
            },
            mockContext
          );

          expect(
            mockContext.clients.hubspotEmail.sendEmissionAllocationDeletedEmail
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              supplierCompanyName: senderCompany.name,
              emissionYear: String(emissionAllocationSentByMe.year),
              emissionAmount: String(emissionAllocationSentByMe.emissions),
            })
          );

          expect(
            mockContext.clients.hubspotEmail.sendEmissionAllocationDeletedEmail
          ).toBeCalledTimes(recipients.length);
        });
      });

      describe('when allocation has not yet been approved', () => {
        it('should NOT notify customer SUPPLIER_EDITORs of the deleted allocation', async () => {
          findOne.mockImplementationOnce(() => ({
            ...emissionAllocationSentByMe,
            status: EmissionAllocationStatus.AwaitingApproval,
          }));
          const recipients = [{ email: 'a' }, { email: 'b' }];
          findRecipients.mockImplementationOnce(() => recipients);
          const senderCompany = { name: 'Name Ltd' };
          findSenderCompany.mockImplementationOnce(() => senderCompany);

          await controller.delete(
            {
              id: emissionAllocationSentByMe.id,
            },
            mockContext
          );

          expect(getAllocationDeletedTemplate).not.toHaveBeenCalled();
          expect(addJobSendEmailToQueue).not.toHaveBeenCalled();
        });
      });

      it('should throw an error if allocation for the id does not exist', async () => {
        findOne.mockImplementation(() => undefined);

        expect.assertions(2);
        try {
          await controller.delete(
            {
              id: emissionAllocationSentByMe.id,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toEqual(ALLOCATION_DOES_NOT_EXIST);
          expect(
            controller.deleteAllocationAndUpdateCustomerScope3
          ).not.toHaveBeenCalled();
        }
      });
    });

    describe('when user represents a customer', () => {
      describe('when allocation status is REQUEST_DISMISSED', () => {
        it('should allow user to delete an allocation', async () => {
          const dismissedAllocation = {
            ...emissionAllocationRequestedByMe,
            status: EmissionAllocationStatus.RequestDismissed,
          };

          findOne.mockImplementationOnce(() => dismissedAllocation);
          const result = await controller.delete(
            {
              id: emissionAllocationRequestedByMe.id,
            },
            mockContext
          );
          expect(result).toEqual(dismissedAllocation.id);
          const [[auditCall]] = saveAuditTrail.mock.calls;
          expect(auditCall.userId).toBe(mockContext.user.id);
          expect(auditCall.action).toBe(EMISSION_ALLOCATION_DELETED_ACTION);
          expect(JSON.parse(auditCall.previousPayload)).toEqual(
            dismissedAllocation
          );
        });
      });

      describe('when allocation status is NOT REQUEST_DISMISSED', () => {
        it('should throw an error', async () => {
          findOne.mockImplementationOnce(
            () => emissionAllocationSentBySupplier
          );
          expect.assertions(2);
          try {
            await controller.delete(
              {
                id: emissionAllocationSentBySupplier.id,
              },
              mockContext
            );
          } catch (err) {
            expect(err.message).toEqual(DELETE_NOT_ALLOWED);
            expect(
              controller.deleteAllocationAndUpdateCustomerScope3
            ).not.toHaveBeenCalled();
          }
        });
      });
    });

    describe('when user represents an external user', () => {
      it('should throw an error', async () => {
        findOne.mockImplementationOnce(() => externalEmissionAllocation);
        expect.assertions(2);
        try {
          await controller.delete(
            {
              id: externalEmissionAllocation.id,
            },
            mockContext
          );
        } catch (err) {
          expect(err.message).toEqual(USER_COMPANY_ERROR);
          expect(
            controller.deleteAllocationAndUpdateCustomerScope3
          ).not.toHaveBeenCalled();
        }
      });
    });
  });
});
