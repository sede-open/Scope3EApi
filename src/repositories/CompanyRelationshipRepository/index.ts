import { EntityRepository } from 'typeorm';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import {
  CompanyRelationship,
  CompanyRelationshipType,
  InviteStatus,
} from '../../types';
import { CustomRepository } from '../Repository';

interface CountRelations {
  companyId: string;
  lookupField: 'customer_id' | 'supplier_id';
  validStatuses: InviteStatus[];
}

interface CountCustomers {
  companyId: string;
  validStatuses?: InviteStatus[];
}

interface CountSuppliers {
  companyId: string;
  validStatuses?: InviteStatus[];
}

interface PendingInvitatons {
  companyId: string;
}

@EntityRepository(CompanyRelationshipEntity)
export class CompanyRelationshipRepository extends CustomRepository<
  CompanyRelationshipEntity,
  CompanyRelationship
> {
  private async countRelations({
    companyId,
    lookupField,
    validStatuses,
  }: CountRelations): Promise<number> {
    return this.createQueryBuilder('customer_relationship')
      .where(`customer_relationship.status IN (:...statuses)`, {
        statuses: validStatuses,
      })
      .andWhere(`customer_relationship.${lookupField} = :company_id`, {
        company_id: companyId,
      })
      .getCount();
  }

  async countSuppliers({
    companyId,
    validStatuses = Object.values(InviteStatus),
  }: CountSuppliers): Promise<number> {
    return this.countRelations({
      companyId,
      lookupField: 'customer_id',
      validStatuses,
    });
  }

  async countCustomers({
    companyId,
    validStatuses = Object.values(InviteStatus),
  }: CountCustomers): Promise<number> {
    return this.countRelations({
      companyId,
      lookupField: 'supplier_id',
      validStatuses,
    });
  }

  /**
   * This function returns invitations that a comany has received but has not yet approved.
   * @returns Count of supplier or customer invitations that need to be approved
   */
  async pendingInvitations({ companyId }: PendingInvitatons) {
    const rows = await this.find({
      where: [
        {
          supplierId: companyId,
          status: InviteStatus.AwaitingSupplierApproval,
          inviteType: CompanyRelationshipType.Supplier,
        },
        {
          customerId: companyId,
          status: InviteStatus.AwaitingCustomerApproval,
          inviteType: CompanyRelationshipType.Customer,
        },
      ],
      relations: ['customer', 'supplier'],
    });
    const count = rows.length;
    return { rows, count };
  }
}
