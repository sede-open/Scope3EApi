import { EntityManager, In, Repository } from 'typeorm';
import { Job } from 'bull';
import {
  CompanyRelationshipType,
  CreateEmissionAllocationInput,
  DeleteEmissionAllocationInput,
  EmissionAllocation,
  EmissionAllocationDirection,
  EmissionAllocationStatus,
  EmissionAllocationType,
  InviteStatus,
  RoleName,
  UpdateEmissionAllocationInput,
} from '../../types';
import { ControllerFunction, ControllerFunctionAsync } from '../types';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { ApolloError } from 'apollo-server-express';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import {
  EMISSION_ALLOCATION_CREATED_ACTION,
  EMISSION_ALLOCATION_DELETED_ACTION,
  EMISSION_ALLOCATION_UPDATED_ACTION,
} from '../../constants/audit';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import {
  getCustomerScope3Adjustment,
  isValidAllocationStatusChange,
} from './utils';
import { AllocationAuditPayloadType } from './types';
import { getAllocationSubmissionTemplate } from '../../emailTemplates/allocationSubmission';
import { addJobSendEmailToQueue } from '../../jobs/tasks/email/queue';
import { getAllocationApprovedTemplate } from '../../emailTemplates/allocationApproved';
import { getAllocationRejectedTemplate } from '../../emailTemplates/allocationRejected';
import { getAllocationUpdatedTemplate } from '../../emailTemplates/allocationUpdated';
import { getAllocationDeletedTemplate } from '../../emailTemplates/allocationDeleted';
import { getAllocationRequestedTemplate } from '../../emailTemplates/allocationRequested';
import { Flags, getConfig } from '../../config';
import { HubspotTransactionalJobData } from '../../jobs/tasks/email/types';
import { UserEntity } from '../../entities/User';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';

export const NO_COMPANY_RELATIONSHIP_ERROR =
  'Emission allocation could not be created';

export const ALLOCATION_EXISTS =
  'Emission allocation already exists for the year';

export const MISSING_FIELDS =
  'Emission allocation could not be created - missing information';

export const CANT_UPDATE_INVITE_STATUS = 'Invite status could not be updated';

export const ALLOCATION_DOES_NOT_EXIST = 'Emission allocation does not exist';

export const NO_EMISSION_ERROR = 'Emission does not exist';

export const CANNOT_ASSIGN_EMISSION = 'Emission could not be assigned';

export const INVALID_STATUS_CHANGE = 'Invalid status change';

export const DELETE_NOT_ALLOWED = 'Delete action is not permitted';

enum AllocationNotification {
  ALLOCATION_SUBMITTED = 'ALLOCATION_SUBMITTED',
  ALLOCATION_APPROVED = 'ALLOCATION_APPROVED',
  ALLOCATION_REJECTED = 'ALLOCATION_REJECTED',
  ALLOCATION_UPDATED = 'ALLOCATION_UPDATED',
  ALLOCATION_DELETED = 'ALLOCATION_DELETED',
  ALLOCATION_REQUESTED = 'ALLOCATION_REQUESTED',
}

export class EmissionAllocationController {
  constructor(
    private emissionAllocationRepository: Repository<EmissionAllocationEntity>,
    private companyRelationshipRepository: Repository<CompanyRelationshipEntity>,
    private emissionRepository: Repository<CorporateEmissionEntity>
  ) {}

  findByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
      emissionAllocation?: EmissionAllocationDirection;
      statuses?: EmissionAllocationStatus[];
      year?: number;
    },
    EmissionAllocation[]
  > = async (args, context) => {
    if (context.user.companyId !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const commonWhereOptions: {
      status?: unknown;
      year?: number;
    } = {};

    const whereOptions: {
      status?: unknown;
      supplierId?: string;
      customerId?: string;
    }[] = [];

    if (args.statuses) {
      commonWhereOptions.status = In(args.statuses);
    }

    if (args.year) {
      commonWhereOptions.year = args.year;
    }

    if (
      args.emissionAllocation ===
      EmissionAllocationDirection.EmissionAllocatedBySuppliers
    ) {
      whereOptions.push({ ...commonWhereOptions, customerId: args.companyId });
    }

    if (
      args.emissionAllocation ===
      EmissionAllocationDirection.EmissionAllocatedToCustomers
    ) {
      whereOptions.push({ ...commonWhereOptions, supplierId: args.companyId });
    }

    if (!args.emissionAllocation) {
      whereOptions.push({ ...commonWhereOptions, supplierId: args.companyId });
      whereOptions.push({ ...commonWhereOptions, customerId: args.companyId });
    }

    return this.emissionAllocationRepository.find({
      where: whereOptions,
    });
  };

  findByEmissionId: ControllerFunctionAsync<
    {
      emissionId: string;
    },
    EmissionAllocation[]
  > = async (args) => {
    return this.emissionAllocationRepository.find({
      where: [
        { supplierEmissionId: args.emissionId },
        { customerEmissionId: args.emissionId },
      ],
    });
  };

  emissionsAllocatedToMyCompany: ControllerFunctionAsync<
    {
      supplierId: string;
    },
    EmissionAllocation[]
  > = async (args, context) => {
    return this.emissionAllocationRepository.find({
      where: {
        status: EmissionAllocationStatus.Approved,
        customerId: context.user.companyId,
        supplierId: args.supplierId,
        type: EmissionAllocationType.Scope_3,
      },
      order: {
        year: 'ASC',
      },
    });
  };

  create: ControllerFunctionAsync<
    CreateEmissionAllocationInput,
    EmissionAllocation
  > = async (args, context) => {
    const relationship = await this.companyRelationshipRepository.findOne({
      supplierId: args.supplierId,
      customerId: args.customerId,
      status: InviteStatus.Approved,
    });

    if (!relationship) {
      throw new ApolloError(NO_COMPANY_RELATIONSHIP_ERROR);
    }

    const existingAllocation = await this.emissionAllocationRepository.findOne({
      supplierId: args.supplierId,
      customerId: args.customerId,
      year: args.year,
    });

    if (existingAllocation) {
      throw new ApolloError(ALLOCATION_EXISTS);
    }

    const userBelongsToSupplier = context.user.companyId === args.supplierId;
    const userBelongsToCustomer = context.user.companyId === args.customerId;

    if (userBelongsToSupplier) {
      return this.createEmissionAllocationSubmission(args, context);
    }

    if (userBelongsToCustomer) {
      return this.createEmissionAllocationRequest(args, context);
    }

    throw new ApolloError(USER_COMPANY_ERROR);
  };

  createEmissionAllocationSubmission: ControllerFunctionAsync<
    CreateEmissionAllocationInput,
    EmissionAllocation
  > = async (args, context) => {
    if (!args.emissions || !args.supplierEmissionId) {
      throw new ApolloError(MISSING_FIELDS);
    }

    const emission = await this.emissionRepository.findOne({
      where: {
        id: args.supplierEmissionId,
        companyId: context.user.companyId,
      },
    });

    if (!emission) {
      throw new ApolloError(NO_EMISSION_ERROR);
    }

    if (emission.year !== args.year) {
      throw new ApolloError(CANNOT_ASSIGN_EMISSION);
    }

    const allocation = new EmissionAllocationEntity();
    allocation.supplierId = args.supplierId;
    allocation.customerId = args.customerId;
    allocation.year = args.year;
    allocation.emissions = args.emissions;
    allocation.status = EmissionAllocationStatus.AwaitingApproval;
    allocation.supplierApproverId = context.user.id;
    allocation.type = EmissionAllocationType.Scope_3;
    allocation.supplierEmissionId = args.supplierEmissionId;
    allocation.allocationMethod = args.allocationMethod;

    const savedAllocation = await this.emissionAllocationRepository.save(
      allocation
    );

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: EMISSION_ALLOCATION_CREATED_ACTION,
        currentPayload: JSON.stringify(savedAllocation),
      },
      context
    );

    await this.sendAllocationNotification(
      {
        senderCompanyId: args.supplierId,
        recipientsCompanyId: args.customerId,
        allocationYear: args.year,
        notificationType: AllocationNotification.ALLOCATION_SUBMITTED,
      },
      context
    );

    return savedAllocation;
  };

  createEmissionAllocationRequest: ControllerFunctionAsync<
    CreateEmissionAllocationInput,
    EmissionAllocation
  > = async (args, context) => {
    const allocation = new EmissionAllocationEntity();
    allocation.supplierId = args.supplierId;
    allocation.customerId = args.customerId;
    allocation.year = args.year;
    allocation.status = EmissionAllocationStatus.Requested;
    allocation.customerApproverId = context.user.id;
    allocation.type = EmissionAllocationType.Scope_3;
    allocation.note = args.note;

    const savedAllocation = await this.emissionAllocationRepository.save(
      allocation
    );

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: EMISSION_ALLOCATION_CREATED_ACTION,
        currentPayload: JSON.stringify(savedAllocation),
      },
      context
    );

    await this.sendAllocationNotification(
      {
        senderCompanyId: args.customerId,
        recipientsCompanyId: args.supplierId,
        allocationYear: args.year,
        notificationType: AllocationNotification.ALLOCATION_REQUESTED,
      },
      context
    );

    return savedAllocation;
  };

  update: ControllerFunctionAsync<
    UpdateEmissionAllocationInput,
    EmissionAllocation
  > = async (args, context) => {
    const allocation = await this.emissionAllocationRepository.findOne({
      id: args.id,
    });
    if (!allocation) {
      throw new ApolloError(ALLOCATION_DOES_NOT_EXIST);
    }

    const userBelongsToSupplier =
      context.user.companyId === allocation.supplierId;
    const userBelongsToCustomer =
      context.user.companyId === allocation.customerId;
    if (userBelongsToSupplier) {
      return this.updateAllocationAsSupplier({ allocation, ...args }, context);
    }

    if (userBelongsToCustomer) {
      return this.updateAllocationAsCustomer({ allocation, ...args }, context);
    }

    throw new ApolloError(USER_COMPANY_ERROR);
  };

  updateAllocationAsSupplier: ControllerFunctionAsync<
    UpdateEmissionAllocationInput & {
      allocation: EmissionAllocationEntity;
    },
    EmissionAllocation
  > = async (
    { allocation, emissions, allocationMethod, supplierEmissionId, status },
    context
  ) => {
    if (
      status !== EmissionAllocationStatus.RequestDismissed &&
      (!emissions || !supplierEmissionId)
    ) {
      throw new ApolloError(MISSING_FIELDS);
    }

    const emission = await this.emissionRepository.findOne({
      where: {
        id: supplierEmissionId,
        companyId: context.user.companyId,
      },
    });

    if (status !== EmissionAllocationStatus.RequestDismissed) {
      if (!emission) {
        throw new ApolloError(NO_EMISSION_ERROR);
      }
      if (emission.year !== allocation.year) {
        throw new ApolloError(CANNOT_ASSIGN_EMISSION);
      }
    }

    const previousAllocation: AllocationAuditPayloadType = {
      ...allocation,
    };

    if (emissions !== allocation.emissions) {
      allocation.emissions = emissions;
    }

    if (allocationMethod !== allocation.allocationMethod) {
      allocation.allocationMethod = allocationMethod;
    }

    if (supplierEmissionId !== allocation.supplierEmissionId) {
      allocation.supplierEmissionId = supplierEmissionId;
    }

    // if a supplier is not dismissing a customer request,
    // any updates should be approved by the customer
    allocation.status =
      status === EmissionAllocationStatus.RequestDismissed
        ? EmissionAllocationStatus.RequestDismissed
        : EmissionAllocationStatus.AwaitingApproval;

    await this.saveAllocationAndUpdateCustomerScope3(
      {
        allocation,
        previousAllocation,
      },
      context
    );

    if (allocation.supplierId) {
      if (
        previousAllocation.status === EmissionAllocationStatus.Requested &&
        allocation.status === EmissionAllocationStatus.AwaitingApproval
      ) {
        await this.sendAllocationNotification(
          {
            senderCompanyId: allocation.supplierId,
            recipientsCompanyId: allocation.customerId,
            allocationYear: allocation.year,
            notificationType: AllocationNotification.ALLOCATION_SUBMITTED,
          },
          context
        );
      } else if (
        allocation.status !== EmissionAllocationStatus.RequestDismissed
      ) {
        this.sendAllocationNotification(
          {
            senderCompanyId: allocation.supplierId,
            allocationYear: allocation.year,
            recipientsCompanyId: allocation.customerId,
            notificationType: AllocationNotification.ALLOCATION_UPDATED,
          },
          context
        );
      }
    }

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: EMISSION_ALLOCATION_UPDATED_ACTION,
        currentPayload: JSON.stringify(allocation),
        previousPayload: JSON.stringify(previousAllocation),
      },
      context
    );

    return allocation;
  };

  updateAllocationAsCustomer: ControllerFunctionAsync<
    UpdateEmissionAllocationInput & {
      allocation: EmissionAllocation;
    },
    EmissionAllocation
  > = async (
    {
      allocation,
      status,
      categoryId,
      customerEmissionId,
      addedToCustomerScopeTotal,
      note,
    },
    context
  ) => {
    if (
      status === EmissionAllocationStatus.Approved &&
      (!categoryId || !customerEmissionId)
    ) {
      throw new ApolloError(MISSING_FIELDS);
    }

    if (
      status &&
      allocation.status !== status &&
      !isValidAllocationStatusChange(
        allocation.status,
        status,
        CompanyRelationshipType.Customer
      )
    ) {
      throw new ApolloError(INVALID_STATUS_CHANGE);
    }

    if (customerEmissionId) {
      const emission = await this.emissionRepository.findOne({
        where: {
          id: customerEmissionId,
          companyId: context.user.companyId,
        },
      });
      if (!emission) {
        throw new ApolloError(NO_EMISSION_ERROR);
      }

      if (emission.year !== allocation.year) {
        throw new ApolloError(CANNOT_ASSIGN_EMISSION);
      }
    }

    const previousAllocation: AllocationAuditPayloadType = {
      ...allocation,
    };

    if (
      addedToCustomerScopeTotal != null &&
      addedToCustomerScopeTotal !== allocation.addedToCustomerScopeTotal
    ) {
      allocation.addedToCustomerScopeTotal = addedToCustomerScopeTotal;
    }

    if (categoryId != null && categoryId !== allocation.categoryId) {
      allocation.categoryId = categoryId;
    }

    if (
      customerEmissionId != null &&
      customerEmissionId !== allocation.customerEmissionId
    ) {
      allocation.customerEmissionId = customerEmissionId;
    }

    if (note != null && note !== allocation.note) {
      allocation.note = note;
    }

    if (status != null && status !== allocation.status) {
      allocation.status = status;

      if (
        status === EmissionAllocationStatus.Rejected &&
        allocation.customerEmissionId
      ) {
        allocation.customerEmissionId = null;
      }
    }

    await this.saveAllocationAndUpdateCustomerScope3(
      {
        allocation,
        previousAllocation,
      },
      context
    );

    if (
      allocation.supplierId &&
      previousAllocation.status === EmissionAllocationStatus.AwaitingApproval &&
      allocation.status === EmissionAllocationStatus.Approved
    ) {
      await this.sendAllocationNotification(
        {
          senderCompanyId: allocation.customerId,
          allocationYear: allocation.year,
          recipientsCompanyId: allocation.supplierId,
          notificationType: AllocationNotification.ALLOCATION_APPROVED,
        },
        context
      );
    } else if (
      allocation.supplierId &&
      previousAllocation.status === EmissionAllocationStatus.AwaitingApproval &&
      allocation.status === EmissionAllocationStatus.Rejected
    ) {
      await this.sendAllocationNotification(
        {
          senderCompanyId: allocation.customerId,
          allocationYear: allocation.year,
          recipientsCompanyId: allocation.supplierId,
          notificationType: AllocationNotification.ALLOCATION_REJECTED,
        },
        context
      );
    }

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: EMISSION_ALLOCATION_UPDATED_ACTION,
        currentPayload: JSON.stringify(allocation),
        previousPayload: JSON.stringify(previousAllocation),
      },
      context
    );

    return allocation;
  };

  delete: ControllerFunctionAsync<
    DeleteEmissionAllocationInput,
    string
  > = async ({ id }, context) => {
    const allocation = await this.emissionAllocationRepository.findOne({
      where: { id },
    });
    if (!allocation) {
      throw new ApolloError(ALLOCATION_DOES_NOT_EXIST);
    }

    const userBelongsToSupplier =
      context.user.companyId === allocation.supplierId;
    const userBelongsToCustomer =
      context.user.companyId === allocation.customerId;

    if (userBelongsToSupplier) {
      return this.deleteAllocationAsSupplier({ allocation }, context);
    }

    if (userBelongsToCustomer) {
      return this.deleteAllocationAsCustomer({ allocation }, context);
    }

    throw new ApolloError(USER_COMPANY_ERROR);
  };

  deleteAllocationAsSupplier: ControllerFunctionAsync<
    {
      allocation: EmissionAllocationEntity;
    },
    string
  > = async ({ allocation }, context) => {
    await this.deleteAllocationAndUpdateCustomerScope3({ allocation }, context);

    if (
      allocation.supplierId &&
      allocation.status === EmissionAllocationStatus.Approved
    ) {
      this.sendAllocationNotification(
        {
          senderCompanyId: allocation.supplierId,
          allocationYear: allocation.year,
          recipientsCompanyId: allocation.customerId,
          emissions: allocation.emissions,
          notificationType: AllocationNotification.ALLOCATION_DELETED,
        },
        context
      );
    }

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: EMISSION_ALLOCATION_DELETED_ACTION,
        previousPayload: JSON.stringify(allocation),
      },
      context
    );
    return allocation.id;
  };

  deleteAllocationAsCustomer: ControllerFunctionAsync<
    {
      allocation: EmissionAllocationEntity;
    },
    string
  > = async ({ allocation }, context) => {
    if (allocation.status !== EmissionAllocationStatus.RequestDismissed) {
      throw new ApolloError(DELETE_NOT_ALLOWED);
    }

    await this.emissionAllocationRepository.delete(allocation);

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: EMISSION_ALLOCATION_DELETED_ACTION,
        previousPayload: JSON.stringify(allocation),
      },
      context
    );

    return allocation.id;
  };

  deleteAllocationAndUpdateCustomerScope3: ControllerFunctionAsync<
    {
      allocation: EmissionAllocationEntity;
    },
    void
  > = async ({ allocation }, context) => {
    return this.emissionAllocationRepository.manager.transaction(
      async (entityManager) => {
        await entityManager.delete(EmissionAllocationEntity, allocation);
        await this.updateCustomerScope3(
          { previousAllocation: allocation, entityManager },
          context
        );
      }
    );
  };

  saveAllocationAndUpdateCustomerScope3: ControllerFunctionAsync<
    {
      allocation: EmissionAllocationEntity | EmissionAllocation;
      previousAllocation: AllocationAuditPayloadType;
    },
    void
  > = async ({ allocation, previousAllocation }, context) => {
    return this.emissionAllocationRepository.manager.transaction(
      async (entityManager) => {
        await entityManager.save(allocation);
        await this.updateCustomerScope3(
          { allocation, previousAllocation, entityManager },
          context
        );
      }
    );
  };

  updateCustomerScope3: ControllerFunctionAsync<
    {
      previousAllocation: AllocationAuditPayloadType;
      entityManager: EntityManager;
      allocation?: EmissionAllocationEntity | EmissionAllocation;
    },
    void
  > = async ({ allocation, previousAllocation, entityManager }) => {
    const emissionId =
      allocation?.customerEmissionId ?? previousAllocation.customerEmissionId;

    const customerScope3Adjustment = getCustomerScope3Adjustment({
      allocation,
      previousAllocation,
    });

    if (customerScope3Adjustment) {
      const customerEmission = await this.emissionRepository.findOne({
        where: {
          id: emissionId,
        },
      });

      if (customerEmission) {
        customerEmission.scope3 =
          (customerEmission.scope3 ?? 0) + customerScope3Adjustment;
        await entityManager.save(customerEmission);
      }
    }
  };

  private sendAllocationNotification: ControllerFunctionAsync<
    {
      senderCompanyId: string;
      recipientsCompanyId: string;
      allocationYear: number;
      notificationType: AllocationNotification;
      emissions?: number | null;
    },
    void
  > = async (args, context) => {
    const recipients = await context.controllers.user.findAllByCompanyId(
      {
        companyId: args.recipientsCompanyId,
        roleNames: [RoleName.SupplierEditor],
      },
      context
    );

    const senderCompany = await context.controllers.company.findById(
      {
        id: args.senderCompanyId,
      },
      context
    );

    if (senderCompany) {
      const { flags } = getConfig();
      if (flags[Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]) {
        await Promise.all(
          recipients.map((recipient) => {
            return this.sendEmissionAllocationEmail(
              {
                recipient,
                senderCompanyName: senderCompany.name,
                allocationYear: args.allocationYear,
                notificationType: args.notificationType,
                emissions: args.emissions,
              },
              context
            );
          })
        );
      } else {
        const {
          template,
          subject,
        } = this.getNotificationEmailTemplateAndSubject(
          {
            senderCompanyName: senderCompany.name,
            allocationYear: args.allocationYear,
            notificationType: args.notificationType,
            emissions: args.emissions,
          },
          context
        );
        await Promise.all(
          recipients.map((recipient) => {
            return addJobSendEmailToQueue({
              recipient: recipient.email,
              subject,
              body: template,
            });
          })
        );
      }
    }
  };

  private getNotificationEmailTemplateAndSubject: ControllerFunction<
    {
      senderCompanyName: string;
      allocationYear: number;
      notificationType: AllocationNotification;
      emissions?: number | null;
    },
    { template: string; subject: string }
  > = (args) => {
    switch (args.notificationType) {
      case AllocationNotification.ALLOCATION_SUBMITTED:
        return getAllocationSubmissionTemplate({
          supplierName: args.senderCompanyName,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/pending-requests`,
          allocationYear: args.allocationYear,
        });
      case AllocationNotification.ALLOCATION_APPROVED:
        return getAllocationApprovedTemplate({
          customerName: args.senderCompanyName,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/customers`,
          allocationYear: args.allocationYear,
        });
      case AllocationNotification.ALLOCATION_REJECTED:
        return getAllocationRejectedTemplate({
          customerName: args.senderCompanyName,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/customers`,
          allocationYear: args.allocationYear,
        });
      case AllocationNotification.ALLOCATION_UPDATED:
        return getAllocationUpdatedTemplate({
          supplierName: args.senderCompanyName,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/pending-requests`,
          allocationYear: args.allocationYear,
        });
      case AllocationNotification.ALLOCATION_DELETED:
        if (args.emissions) {
          return getAllocationDeletedTemplate({
            supplierName: args.senderCompanyName,
            ctaLink: `${process.env.WEB_APP_BASE_URL}/dashboard`,
            allocationYear: args.allocationYear,
            emissions: args.emissions,
          });
        }
        throw Error('Deleted emissions number is missing');
      case AllocationNotification.ALLOCATION_REQUESTED:
        return getAllocationRequestedTemplate({
          customerName: args.senderCompanyName,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/value-chain/pending-requests`,
          allocationYear: args.allocationYear,
        });
      default:
        throw Error('Allocation notification could not be created');
    }
  };

  private sendEmissionAllocationEmail: ControllerFunction<
    {
      recipient: UserEntity;
      senderCompanyName: string;
      allocationYear: number;
      notificationType: AllocationNotification;
      emissions?: number | null;
    },
    Promise<Job<HubspotTransactionalJobData>>
  > = (
    {
      recipient,
      allocationYear,
      senderCompanyName,
      emissions,
      notificationType,
    },
    context
  ) => {
    const emissionYear = String(allocationYear);

    switch (notificationType) {
      case AllocationNotification.ALLOCATION_SUBMITTED:
        return context.clients.hubspotEmail.sendEmissionAllocationSubmittedEmail(
          {
            recipient,
            emissionYear,
            supplierCompanyName: senderCompanyName,
          }
        );
      case AllocationNotification.ALLOCATION_APPROVED:
        return context.clients.hubspotEmail.sendEmissionAllocationAcceptedEmail(
          {
            recipient,
            emissionYear,
            customerCompanyName: senderCompanyName,
          }
        );
      case AllocationNotification.ALLOCATION_REJECTED:
        return context.clients.hubspotEmail.sendEmissionAllocationRejectedEmail(
          {
            recipient,
            customerCompanyName: senderCompanyName,
            emissionYear,
          }
        );
      case AllocationNotification.ALLOCATION_UPDATED:
        return context.clients.hubspotEmail.sendEmissionAllocationUpdatedEmail({
          recipient,
          supplierCompanyName: senderCompanyName,
          emissionYear,
        });
      case AllocationNotification.ALLOCATION_DELETED:
        if (emissions) {
          return context.clients.hubspotEmail.sendEmissionAllocationDeletedEmail(
            {
              recipient,
              supplierCompanyName: senderCompanyName,
              emissionYear,
              emissionAmount: String(emissions),
            }
          );
        }
        throw Error('Deleted emissions number is missing');
      case AllocationNotification.ALLOCATION_REQUESTED:
        return context.clients.hubspotEmail.sendEmissionAllocationRequestEmail({
          recipient,
          customerCompanyName: senderCompanyName,
          emissionYear,
        });
      default:
        throw Error('Allocation notification could not be sent');
    }
  };
}
