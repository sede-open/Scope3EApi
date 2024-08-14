import { In } from 'typeorm';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { CompanyRelationshipRepository } from '../../repositories/CompanyRelationshipRepository';
import {
  CompanyRelationship,
  CompanyRelationshipType,
  Invitation,
  InviteStatus,
} from '../../types';
import { BaseService } from '../BaseService';

export class CompanyRelationshipService extends BaseService<
  CompanyRelationshipEntity,
  CompanyRelationship
> {
  async networkSummary(companyId: string) {
    const companyRelationshipRepository = await this.databaseService.getRepository(
      CompanyRelationshipRepository
    );

    const [numCustomers, numSuppliers, pendingInvitations] = await Promise.all([
      companyRelationshipRepository.countCustomers({
        companyId,
        validStatuses: [InviteStatus.Approved],
      }),
      companyRelationshipRepository.countSuppliers({
        companyId,
        validStatuses: [InviteStatus.Approved],
      }),
      companyRelationshipRepository.pendingInvitations({
        companyId,
      }),
    ]);

    return {
      companyId,
      numSuppliers,
      numCustomers,
      numPendingInvitations: pendingInvitations.count,
      pendingInvitations: pendingInvitations.rows.map(
        this.transformCompanyRelationshipToInvite
      ),
    };
  }

  private transformCompanyRelationshipToInvite({
    id,
    createdAt,
    updatedAt,
    inviteType,
    status,
    note,
    ...rest
  }: CompanyRelationshipEntity): Invitation {
    return {
      id,
      updatedAt,
      createdAt,
      inviteType,
      status,
      note,
      customerName: rest.customer.name,
      supplierName: rest.supplier.name,
    };
  }

  // target company is a Supplier/Customer of the company
  async findActiveRelationship(companyId: string, targetCompanyId: string) {
    if (companyId === targetCompanyId) {
      throw Error('Cannot find relationship with self');
    }

    const companyRelationshipRepository = await this.databaseService.getRepository(
      CompanyRelationshipRepository
    );

    const relationship = await companyRelationshipRepository.findOne({
      where: {
        status: InviteStatus.Approved,
        customerId: In([companyId, targetCompanyId]),
        supplierId: In([companyId, targetCompanyId]),
      },
    });

    if (relationship?.supplierId === targetCompanyId) {
      return CompanyRelationshipType.Supplier;
    }

    if (relationship?.customerId === targetCompanyId) {
      return CompanyRelationshipType.Customer;
    }

    return null;
  }

  async findPendingInvitation(companyId: string, targetCompanyId: string) {
    if (companyId === targetCompanyId) {
      throw Error('Cannot find relationship with self');
    }

    const companyRelationshipRepository = await this.databaseService.getRepository(
      CompanyRelationshipRepository
    );

    return companyRelationshipRepository.findOne({
      where: {
        status: In([
          InviteStatus.AwaitingCustomerApproval,
          InviteStatus.AwaitingSupplierApproval,
        ]),
        customerId: In([companyId, targetCompanyId]),
        supplierId: In([companyId, targetCompanyId]),
      },
    });
  }
}
