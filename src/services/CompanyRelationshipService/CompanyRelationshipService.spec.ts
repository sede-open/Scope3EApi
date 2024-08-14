import { In } from 'typeorm';
import { CompanyRelationshipService } from '.';
import { CompanyEntity } from '../../entities/Company';
import { createCompanyRelationshipMock } from '../../mocks/companyRelationship';
import { CompanyRelationshipRepository } from '../../repositories/CompanyRelationshipRepository';
import { CompanyRelationshipType, InviteStatus } from '../../types';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('CompanyRelationshipService', () => {
  describe('networkSummary', () => {
    const companyId = 'some-company-id';

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should call the three count queries', async () => {
      const companyRelationship = createCompanyRelationshipMock({
        inviteType: CompanyRelationshipType.Customer,
        status: InviteStatus.AwaitingCustomerApproval,
        customer: {
          name: 'test customer name',
        } as CompanyEntity,
        supplier: { name: 'another customer name' } as CompanyEntity,
      });
      const companyRelationshipRepository = ({
        countCustomers: jest.fn(),
        countSuppliers: jest.fn(),
        pendingInvitations: jest
          .fn()
          .mockResolvedValue({ count: 1, rows: [companyRelationship] }),
      } as unknown) as CompanyRelationshipRepository;

      const databaseService = ({
        getRepository: () => companyRelationshipRepository,
      } as unknown) as DatabaseService;

      const service = new CompanyRelationshipService(
        databaseService,
        CompanyRelationshipRepository
      );

      const result = await service.networkSummary(companyId);

      expect(companyRelationshipRepository.countCustomers).toHaveBeenCalledWith(
        {
          companyId,
          validStatuses: [InviteStatus.Approved],
        }
      );
      expect(companyRelationshipRepository.countSuppliers).toHaveBeenCalledWith(
        {
          companyId,
          validStatuses: [InviteStatus.Approved],
        }
      );
      expect(
        companyRelationshipRepository.pendingInvitations
      ).toHaveBeenCalledWith({ companyId });

      expect(result.numPendingInvitations).toEqual(1);
      const {
        id,
        createdAt,
        updatedAt,
        inviteType,
        status,
        note,
      } = companyRelationship;
      const expectedResult = {
        id,
        createdAt,
        updatedAt,
        inviteType,
        status,
        note,
        customerName: companyRelationship.customer?.name,
        supplierName: companyRelationship.supplier?.name,
      };
      expect(result.pendingInvitations).toEqual([expectedResult]);
    });
  });
  describe('findActiveRelationship', () => {
    it(`returns ${CompanyRelationshipType.Supplier} if the target company is the supplier`, async () => {
      const companyId = 'some-company-id';
      const targetCompanyId = 'some-target-company-id';

      const findOne = jest.fn().mockResolvedValue({
        supplierId: targetCompanyId,
      });
      const getRepository = jest.fn().mockResolvedValue({
        findOne,
      });
      const databaseService = ({
        getRepository,
      } as unknown) as DatabaseService;

      const service = new CompanyRelationshipService(
        databaseService,
        CompanyRelationshipRepository
      );

      const result = await service.findActiveRelationship(
        companyId,
        targetCompanyId
      );

      expect(getRepository).toHaveBeenCalledWith(CompanyRelationshipRepository);
      expect(findOne).toHaveBeenCalledWith({
        where: {
          status: InviteStatus.Approved,
          customerId: In([companyId, targetCompanyId]),
          supplierId: In([companyId, targetCompanyId]),
        },
      });
      expect(result).toEqual(CompanyRelationshipType.Supplier);
    });
    it(`returns ${CompanyRelationshipType.Customer} if the target company is the customer`, async () => {
      const companyId = 'some-company-id';
      const targetCompanyId = 'some-target-company-id';

      const findOne = jest.fn().mockResolvedValue({
        customerId: targetCompanyId,
      });
      const getRepository = jest.fn().mockResolvedValue({
        findOne,
      });
      const databaseService = ({
        getRepository,
      } as unknown) as DatabaseService;

      const service = new CompanyRelationshipService(
        databaseService,
        CompanyRelationshipRepository
      );

      const result = await service.findActiveRelationship(
        companyId,
        targetCompanyId
      );

      expect(getRepository).toHaveBeenCalledWith(CompanyRelationshipRepository);
      expect(findOne).toHaveBeenCalledWith({
        where: {
          status: InviteStatus.Approved,
          customerId: In([companyId, targetCompanyId]),
          supplierId: In([companyId, targetCompanyId]),
        },
      });
      expect(result).toEqual(CompanyRelationshipType.Customer);
    });
    it('returns null if no relationship is found', async () => {
      const companyId = 'some-company-id';
      const targetCompanyId = 'some-target-company-id';

      const findOne = jest.fn().mockResolvedValue(undefined);
      const getRepository = jest.fn().mockResolvedValue({
        findOne,
      });
      const databaseService = ({
        getRepository,
      } as unknown) as DatabaseService;

      const service = new CompanyRelationshipService(
        databaseService,
        CompanyRelationshipRepository
      );

      const result = await service.findActiveRelationship(
        companyId,
        targetCompanyId
      );

      expect(getRepository).toHaveBeenCalledWith(CompanyRelationshipRepository);
      expect(findOne).toHaveBeenCalledWith({
        where: {
          status: InviteStatus.Approved,
          customerId: In([companyId, targetCompanyId]),
          supplierId: In([companyId, targetCompanyId]),
        },
      });
      expect(result).toBeNull();
    });
  });
  describe('findPendingInvitation', () => {
    it('throws an error if the company id is the same as the target company id', async () => {
      const companyId = 'some-company-id';

      const service = new CompanyRelationshipService(
        {} as DatabaseService,
        CompanyRelationshipRepository
      );

      await expect(
        service.findPendingInvitation(companyId, companyId)
      ).rejects.toThrowError('Cannot find relationship with self');
    });
    it('returns the relationship if it exists', async () => {
      const companyId = 'some-company-id';
      const targetCompanyId = 'some-target-company-id';

      const findOne = jest.fn().mockResolvedValue({
        customerId: targetCompanyId,
      });
      const getRepository = jest.fn().mockResolvedValue({
        findOne,
      });
      const databaseService = ({
        getRepository,
      } as unknown) as DatabaseService;

      const service = new CompanyRelationshipService(
        databaseService,
        CompanyRelationshipRepository
      );
      await service.findPendingInvitation(companyId, targetCompanyId);

      expect(getRepository).toHaveBeenCalledWith(CompanyRelationshipRepository);
      expect(findOne).toHaveBeenCalledWith({
        where: {
          status: In([
            InviteStatus.AwaitingCustomerApproval,
            InviteStatus.AwaitingSupplierApproval,
          ]),
          customerId: In([companyId, targetCompanyId]),
          supplierId: In([companyId, targetCompanyId]),
        },
      });
    });
  });
});
