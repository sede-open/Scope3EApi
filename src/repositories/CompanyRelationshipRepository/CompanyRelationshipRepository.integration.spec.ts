import { Connection, Repository } from 'typeorm';
import { CompanyRelationshipRepository } from '.';
import { getOrCreateConnection } from '../../dbConnection';
import { CompanyEntity } from '../../entities/Company';
import { companyMock, createCompanyMock } from '../../mocks/company';
import { createCompanyRelationshipMock } from '../../mocks/companyRelationship';
import { createUserMock } from '../../mocks/user';
import { CompanyRelationshipType, InviteStatus, RoleName } from '../../types';
import { UserRepository } from '../UserRepository';

describe('CompanyRelationshipRepository', () => {
  let connection: Connection;
  let companyRelationshipRepository: CompanyRelationshipRepository;
  let companyRepository: Repository<CompanyEntity>;
  let userRepository: UserRepository;

  const meId = '';

  const companyBId = '';
  const companyAUserId = '';

  const companyAId = '';
  const companyBUserId = '';

  const teardown = async () => {
    await companyRelationshipRepository.delete({});
    await userRepository.deleteUsers([companyAUserId, companyBUserId]);
    await companyRepository.delete([companyBId, companyAId]);
    await userRepository.deleteUsers([meId]);
  };

  const setup = async () => {
    await userRepository.save([
      await createUserMock(
        { id: meId, companyId: companyMock.id },
        RoleName.Admin
      ),
    ]);

    await companyRepository.save([
      createCompanyMock({
        id: companyBId,
        createdBy: meId,
        updatedBy: meId,
      }),
      createCompanyMock({
        id: companyAId,
        createdBy: meId,
        updatedBy: meId,
      }),
    ]);
    await userRepository.save([
      await createUserMock(
        { id: companyAUserId, companyId: companyAId },
        RoleName.SupplierEditor
      ),
      await createUserMock(
        { id: companyBUserId, companyId: companyBId },
        RoleName.SupplierEditor
      ),
    ]);
  };

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRelationshipRepository = connection.getCustomRepository(
      CompanyRelationshipRepository
    );
    companyRepository = connection.getRepository(CompanyEntity);
    userRepository = connection.getCustomRepository(UserRepository);
  });

  beforeEach(async () => {
    await teardown();
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  describe('countSuppliers', () => {
    it('should return the number of relationships where the provided companyId is the customer', async () => {
      await companyRelationshipRepository.save([
        createCompanyRelationshipMock({
          customerId: companyMock.id,
          supplierId: companyBId,
          status: InviteStatus.Approved,
          inviteType: CompanyRelationshipType.Supplier,
          customerApproverId: meId,
          supplierApproverId: companyBUserId,
        }),
        createCompanyRelationshipMock({
          customerId: companyBId,
          supplierId: companyMock.id,
          status: InviteStatus.Approved,
          inviteType: CompanyRelationshipType.Customer,
          customerApproverId: companyBUserId,
          supplierApproverId: meId,
        }),
      ]);

      const count = await companyRelationshipRepository.countSuppliers({
        companyId: companyMock.id,
      });

      expect(count).toEqual(1);
    });

    it('should filter by statuses when provided', async () => {
      await companyRelationshipRepository.save([
        createCompanyRelationshipMock({
          customerId: companyMock.id,
          supplierId: companyAId,
          status: InviteStatus.Approved,
          inviteType: CompanyRelationshipType.Supplier,
          customerApproverId: meId,
          supplierApproverId: companyAUserId,
        }),
        createCompanyRelationshipMock({
          customerId: companyMock.id,
          supplierId: companyBId,
          status: InviteStatus.AwaitingSupplierApproval,
          inviteType: CompanyRelationshipType.Supplier,
          customerApproverId: meId,
          supplierApproverId: companyBUserId,
        }),
      ]);

      const count = await companyRelationshipRepository.countSuppliers({
        companyId: companyMock.id,
        validStatuses: [InviteStatus.Approved],
      });

      expect(count).toEqual(1);
    });
  });

  describe('countCustomers', () => {
    it('should return the number of relationships where the provided companyId is the supplier', async () => {
      await companyRelationshipRepository.save([
        createCompanyRelationshipMock({
          customerId: companyMock.id,
          supplierId: companyBId,
          status: InviteStatus.Approved,
          inviteType: CompanyRelationshipType.Supplier,
          customerApproverId: meId,
          supplierApproverId: companyBUserId,
        }),
        createCompanyRelationshipMock({
          customerId: companyBId,
          supplierId: companyMock.id,
          status: InviteStatus.Approved,
          inviteType: CompanyRelationshipType.Customer,
          customerApproverId: companyBUserId,
          supplierApproverId: meId,
        }),
      ]);

      const count = await companyRelationshipRepository.countCustomers({
        companyId: companyMock.id,
      });

      expect(count).toEqual(1);
    });

    it('should filter by statuses when provided', async () => {
      await companyRelationshipRepository.save([
        createCompanyRelationshipMock({
          customerId: companyBId,
          supplierId: companyMock.id,
          status: InviteStatus.Approved,
          inviteType: CompanyRelationshipType.Customer,
          customerApproverId: companyBUserId,
          supplierApproverId: meId,
        }),
        createCompanyRelationshipMock({
          customerId: companyAId,
          supplierId: companyMock.id,
          status: InviteStatus.RejectedByCustomer,
          inviteType: CompanyRelationshipType.Customer,
          customerApproverId: companyAUserId,
          supplierApproverId: meId,
        }),
      ]);

      const count = await companyRelationshipRepository.countCustomers({
        companyId: companyMock.id,
        validStatuses: [InviteStatus.RejectedByCustomer],
      });

      expect(count).toEqual(1);
    });
  });

  describe('pendingInvitations', () => {
    it('should count the number of customer or supplier relationships that have not been approved', async () => {
      await companyRelationshipRepository.save([
        /*  I have been invited but have not accepted (this is what gets included in the count) */
        createCompanyRelationshipMock({
          customerId: companyMock.id,
          supplierId: companyAId,
          status: InviteStatus.AwaitingCustomerApproval,
          inviteType: CompanyRelationshipType.Customer,
          customerApproverId: undefined,
          supplierApproverId: companyAUserId,
        }),
        /* I have sent an invite but the invited company has not accepted */
        createCompanyRelationshipMock({
          customerId: companyBId,
          supplierId: companyMock.id,
          status: InviteStatus.AwaitingCustomerApproval,
          inviteType: CompanyRelationshipType.Customer,
          customerApproverId: undefined,
          supplierApproverId: meId,
        }),
        /* An invite I have received that has already been accepted */
        createCompanyRelationshipMock({
          customerId: companyBId,
          supplierId: companyMock.id,
          status: InviteStatus.Approved,
          inviteType: CompanyRelationshipType.Supplier,
          customerApproverId: companyBUserId,
          supplierApproverId: meId,
        }),
      ]);

      const { count } = await companyRelationshipRepository.pendingInvitations({
        companyId: companyMock.id,
      });

      expect(count).toEqual(1);
    });
  });
});
