import { ApolloError } from 'apollo-server-express';
import { EntityManager, In, Repository } from 'typeorm';
import { getFlag } from '../../clients/LaunchDarklyClient';
import { Flags, getConfig, LaunchDarklyFlags } from '../../config';
import {
  COMPANY_RELATIONSHIP_CREATED_ACTION,
  COMPANY_RELATIONSHIP_DELETED_ACTION,
  COMPANY_RELATIONSHIP_UPDATED_ACTION,
} from '../../constants/audit';
import { getNewConnectionRequestTemplate } from '../../emailTemplates/newConnectionRequest';
import { CompanyEntity } from '../../entities/Company';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { UserEntity } from '../../entities/User';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import { addJobSendEmailToQueue } from '../../jobs/tasks/email/queue';
import { CompanyRelationshipRepository } from '../../repositories/CompanyRelationshipRepository';
import { CompanyQuickConnectService } from '../../services/CompanyQuickConnectService';
import { CompanyRelationshipService } from '../../services/CompanyRelationshipService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import {
  AuthProvider,
  CompanyRelationship,
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
  CompanyStatus,
  CreateCompanyRelationshipInput,
  InviteAndConnectToCompanyInput,
  InviteStatus,
  NetworkSummary,
  RoleName,
  UpdateCompanyRelationshipInput,
} from '../../types';
import { FORBIDDEN_INPUT } from '../../utils/errorStrings';
import { isApprovedCompany } from '../../utils/permissions';
import { doesNotContainHTML } from '../../utils/validators';
import { ControllerFunctionAsync } from '../types';
import { getRepository } from '../utils';
import {
  getInviteStatusChangeEmailInfo,
  isValidInviteStatusChange,
  sendInviteStatusChangeEmail,
} from './utils';

export const COMPANY_RELATIONSHIP_CONNECTED_ERROR =
  'You are already connected to this company';
export const COMPANY_RELATIONSHIP_PENDING_ERROR =
  'An invitation has already been sent to this this company';
export const COMPANY_RELATIONSHIP_REJECTED_ERROR =
  'An invitation has already been rejected by this company. Use the re-send option on the table list to re-invite them';
export const NO_COMPANIES_ERROR =
  'Could not create a relationship between provided companies';
export const RELATIONSHIP_DOESNT_EXIST = 'Relationship does not exist';
export const CANT_UPDATE_INVITE_STATUS = 'Invite status could not be updated';
export const NO_USER_COMPANY = 'Unable to connect to other companies';
export const COMPANY_INVITE_FAIL = 'Company could not be invited';
export const COMPANY_EXISTS_FAIL = 'Company already exists';

export class CompanyRelationshipController {
  constructor(
    private databaseService: DatabaseService,
    private companyRelationshipRepository: CompanyRelationshipRepository,
    private companyRepository: Repository<CompanyEntity>,
    private companyRelationshipService: CompanyRelationshipService,
    private companyQuickConnectService: CompanyQuickConnectService
  ) {}

  private getCompanyRepository = (entityManager?: EntityManager) => {
    return getRepository(CompanyEntity, this.companyRepository, entityManager);
  };

  private getCompanyRelationshipRepository = (
    entityManager?: EntityManager
  ) => {
    return getRepository(
      CompanyRelationshipEntity,
      this.companyRelationshipRepository,
      entityManager
    );
  };

  findByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
      relationshipType?: CompanyRelationshipType;
      status?: InviteStatus;
    },
    CompanyRelationshipEntity[]
  > = async (args, context, entityManager) => {
    if (context.user.companyId !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const commonWhereOptions: {
      status?: string;
    } = {};

    const whereOptions: {
      status?: string;
      supplierId?: string;
      customerId?: string;
    }[] = [];
    if (args.status) {
      commonWhereOptions.status = args.status;
    }

    if (args.relationshipType === CompanyRelationshipType.Customer) {
      whereOptions.push({ ...commonWhereOptions, supplierId: args.companyId });
    }

    if (args.relationshipType === CompanyRelationshipType.Supplier) {
      whereOptions.push({
        ...commonWhereOptions,
        customerId: args.companyId,
      });
    }

    if (!args.relationshipType) {
      whereOptions.push({ ...commonWhereOptions, supplierId: args.companyId });
      whereOptions.push({ ...commonWhereOptions, customerId: args.companyId });
    }
    if (entityManager) {
      this.companyRelationshipService.setEntityManager(entityManager);
    }
    const result = await this.companyRelationshipService.findMany({
      where: whereOptions,
    });
    this.companyRelationshipService.clearEntityManager();
    return result;
  };

  create: ControllerFunctionAsync<
    CreateCompanyRelationshipInput,
    CompanyRelationship
  > = async (
    { inviteType, supplierId, customerId, note },
    context,
    entityManager
  ) => {
    const companyRelationshipRepository = this.getCompanyRelationshipRepository(
      entityManager
    );
    const companyRepository = this.getCompanyRepository(entityManager);

    const isSupplier = inviteType === CompanyRelationshipType.Customer;
    if (
      (isSupplier && supplierId !== context.user.companyId) ||
      (!isSupplier && customerId !== context.user.companyId)
    ) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const relationship = await companyRelationshipRepository.findOne({
      where: { supplierId, customerId },
    });

    if (relationship && relationship.status === InviteStatus.Approved) {
      throw new ApolloError(COMPANY_RELATIONSHIP_CONNECTED_ERROR);
    }

    const pendingStatuses = [
      InviteStatus.AwaitingCustomerApproval,
      InviteStatus.AwaitingSupplierApproval,
    ];

    if (relationship && pendingStatuses.includes(relationship.status)) {
      throw new ApolloError(COMPANY_RELATIONSHIP_PENDING_ERROR);
    }

    const rejectedStatuses = [
      InviteStatus.RejectedByCustomer,
      InviteStatus.RejectedBySupplier,
    ];

    if (relationship && rejectedStatuses.includes(relationship.status)) {
      throw new ApolloError(COMPANY_RELATIONSHIP_REJECTED_ERROR);
    }

    const [supplier, customer] = await companyRepository.find({
      where: { id: In([supplierId, customerId]) },
    });

    if (!supplier || !customer) {
      throw new ApolloError(NO_COMPANIES_ERROR);
    }

    const companyRelationship = new CompanyRelationshipEntity();
    companyRelationship.supplierId = supplierId;
    companyRelationship.customerId = customerId;
    companyRelationship.inviteType = inviteType;
    companyRelationship.note = note;

    if (isSupplier) {
      companyRelationship.status = InviteStatus.AwaitingCustomerApproval;
      companyRelationship.supplierApproverId = context.user.id;
    } else {
      companyRelationship.status = InviteStatus.AwaitingSupplierApproval;
      companyRelationship.customerApproverId = context.user.id;
    }

    const newCompanyRelationship = await companyRelationshipRepository.save(
      companyRelationship
    );

    if (entityManager) {
      this.companyQuickConnectService.databaseService.setEntityManager(
        entityManager
      );
    }

    const senderCompany =
      supplier.id === context.user.companyId ? supplier : customer;
    const recipientsCompany =
      supplier.id === context.user.companyId ? customer : supplier;

    const recommendation =
      recipientsCompany.duns &&
      (await this.companyQuickConnectService.findRecommendation({
        recommendedCompanyDuns: recipientsCompany.duns,
        recommendationForCompanyId: senderCompany.id,
        relationshipType: inviteType,
      }));

    if (recommendation) {
      await this.companyQuickConnectService.updateRecommendation({
        id: recommendation.id,
        currentStatus: recommendation.recommendationStatus,
        newStatus: CompanyRelationshipRecommendationStatus.Accepted,
        reviewedBy: context.user.id,
      });
    }

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: COMPANY_RELATIONSHIP_CREATED_ACTION,
        currentPayload: JSON.stringify(newCompanyRelationship),
      },
      context,
      entityManager
    );

    await this.notifityOfConnectionRequest(
      { senderCompany, recipientsCompany, inviteType },
      context,
      entityManager
    );

    return newCompanyRelationship;
  };

  update: ControllerFunctionAsync<
    UpdateCompanyRelationshipInput,
    CompanyRelationship
  > = async (args, context) => {
    if (args.note && !doesNotContainHTML(args.note)) {
      throw new ApolloError(FORBIDDEN_INPUT);
    }

    const relationship = await this.companyRelationshipRepository.findOne({
      where: { id: args.id },
      relations: ['supplier', 'customer'],
    });

    if (!relationship) {
      throw new ApolloError(RELATIONSHIP_DOESNT_EXIST);
    }

    let approverType;
    if (context.user.companyId === relationship.supplierId) {
      approverType = CompanyRelationshipType.Supplier;
    } else if (context.user.companyId === relationship.customerId) {
      approverType = CompanyRelationshipType.Customer;
    }

    if (!approverType) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    if (
      args.status &&
      !isValidInviteStatusChange(relationship.status, args.status, approverType)
    ) {
      throw new ApolloError(CANT_UPDATE_INVITE_STATUS);
    }

    // for audit trail
    const previousPayload: Omit<
      CompanyRelationshipEntity,
      'supplier' | 'customer'
    > = {
      id: relationship.id,
      supplierId: relationship.supplierId,
      customerId: relationship.customerId,
      supplierApproverId: relationship.supplierApproverId,
      customerApproverId: relationship.customerApproverId,
      note: relationship.note,
      status: relationship.status,
      inviteType: relationship.inviteType,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
    };

    const currentPayload: Omit<
      CompanyRelationshipEntity,
      'supplier' | 'customer'
    > = {
      ...relationship,
    };

    if (args.note !== relationship.note) {
      currentPayload.note = args.note;
      relationship.note = args.note;
    }

    if (args.status && args.status !== relationship.status) {
      currentPayload.status = args.status;
      relationship.status = args.status;
    }

    if (approverType === CompanyRelationshipType.Supplier) {
      relationship.supplierApproverId = context.user.id;
    } else {
      relationship.customerApproverId = context.user.id;
    }

    const updatedRelationship = await this.companyRelationshipRepository.save(
      relationship
    );

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: COMPANY_RELATIONSHIP_UPDATED_ACTION,
        currentPayload: JSON.stringify(currentPayload),
        previousPayload: JSON.stringify(previousPayload),
      },
      context
    );

    // notify users of status change
    const senderCompany =
      context.user.companyId === relationship.supplierId
        ? relationship.supplier
        : relationship.customer;
    const recipientsCompany =
      context.user.companyId === relationship.supplierId
        ? relationship.customer
        : relationship.supplier;

    await this.notifityOfConnectionStatusUpdate(
      {
        senderCompany,
        recipientsCompany,
        inviteType: relationship.inviteType,
        previousInviteStatus: previousPayload.status,
        updatedInviteStatus: currentPayload.status,
      },
      context
    );

    return updatedRelationship;
  };

  inviteNewCompany: ControllerFunctionAsync<
    InviteAndConnectToCompanyInput,
    CompanyRelationship
  > = async (
    { companyDuns: duns, firstName, lastName, email, inviteType, note },
    context
  ) => {
    return this.databaseService.transaction<CompanyRelationship>(
      async (entityManager: EntityManager) => {
        if (!context.user.companyId) {
          throw new ApolloError(NO_USER_COMPANY);
        }

        const existingCompany = await context.controllers.company.findByDuns(
          {
            duns,
          },
          context,
          entityManager
        );

        let company: CompanyEntity | undefined = undefined;

        if (existingCompany?.status === CompanyStatus.InvitationDeclined) {
          company = await context.controllers.company.updateCompanyStatus(
            {
              id: existingCompany.id,
              status: CompanyStatus.PendingUserConfirmation,
            },
            context,
            entityManager
          );
        } else if (!existingCompany) {
          company = await context.controllers.company.create(
            {
              duns,
            },
            context,
            entityManager
          );
        }

        if (company) {
          const invitee = await context.controllers.user.createUserByCompanyInvitation(
            {
              authProvider: AuthProvider.Akamai,
              roleName: RoleName.SupplierEditor,
              firstName,
              lastName,
              email,
              companyId: company.id,
            },
            context,
            entityManager
          );

          const supplierId =
            inviteType === CompanyRelationshipType.Supplier
              ? company.id
              : context.user.companyId;
          const customerId =
            inviteType === CompanyRelationshipType.Supplier
              ? context.user.companyId
              : company.id;

          const pendingRelationship = await this.create(
            {
              supplierId,
              customerId,
              inviteType,
              note,
            },
            context,
            entityManager
          );

          const isHubspotInviteToJoinWorkflowEnabled = await getFlag(
            LaunchDarklyFlags.IS_HUBSPOT_INVITE_TO_JOIN_WORKFLOW_ENABLED,
            false
          );

          if (!isHubspotInviteToJoinWorkflowEnabled) {
            await context.clients.notification.notifyOfInviteToJoin({
              sender: context.user,
              recipient: invitee,
            });
          }

          return pendingRelationship;
        } else {
          if (existingCompany) {
            throw new ApolloError(COMPANY_EXISTS_FAIL);
          }
          throw new ApolloError(COMPANY_INVITE_FAIL);
        }
      }
    );
  };

  private notifityOfConnectionStatusUpdate: ControllerFunctionAsync<
    {
      senderCompany: CompanyEntity;
      recipientsCompany: CompanyEntity;
      inviteType: CompanyRelationshipType;
      previousInviteStatus: InviteStatus;
      updatedInviteStatus: InviteStatus;
    },
    void
  > = async (
    {
      recipientsCompany,
      senderCompany,
      inviteType,
      previousInviteStatus,
      updatedInviteStatus,
    },
    context
  ) => {
    const { flags } = getConfig();

    const recipients = await context.controllers.user.findAllByCompanyId(
      {
        companyId: recipientsCompany.id,
        roleNames: [RoleName.SupplierEditor],
      },
      context
    );

    if (flags[Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]) {
      await Promise.all(
        recipients.map((recipient) => {
          return sendInviteStatusChangeEmail(
            {
              senderCompany,
              recipient,
              inviteType,
              previousInviteStatus,
              updatedInviteStatus,
            },
            context
          );
        })
      );
    } else {
      const { template, subject } = getInviteStatusChangeEmailInfo({
        senderCompany,
        inviteType,
        previousInviteStatus,
        updatedInviteStatus,
      });
      if (template !== '') {
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

  private notifityOfConnectionRequest: ControllerFunctionAsync<
    {
      senderCompany: CompanyEntity;
      recipientsCompany: CompanyEntity;
      inviteType: CompanyRelationshipType;
      entityManager?: EntityManager;
    },
    void
  > = async (args, context, entityManager) => {
    const { flags } = getConfig();

    let recipients: UserEntity[] = [];

    if (isApprovedCompany(args.recipientsCompany)) {
      recipients = await context.controllers.user.findAllByCompanyId(
        {
          companyId: args.recipientsCompany.id,
          roleNames: [RoleName.SupplierEditor],
        },
        context,
        entityManager
      );
    }

    if (recipients.length > 0) {
      if (flags[Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED]) {
        if (args.inviteType === CompanyRelationshipType.Supplier) {
          await Promise.all(
            recipients.map((recipient) => {
              return context.clients.hubspotEmail.sendInviteSupplierEmail({
                recipient,
                inviterName: `${context.user.firstName} ${context.user.lastName}`,
                customerCompanyName: args.senderCompany.name,
              });
            })
          );
        } else {
          await Promise.all(
            recipients.map((recipient) => {
              return context.clients.hubspotEmail.sendInviteCustomerEmail({
                recipient,
                inviterName: `${context.user.firstName} ${context.user.lastName}`,
                supplierCompanyName: args.senderCompany.name,
              });
            })
          );
        }
      } else {
        const { template, subject } = getNewConnectionRequestTemplate({
          connectionName: args.senderCompany.name,
          ctaLink: `${process.env.WEB_APP_BASE_URL}/account-settings`,
          connectionType:
            args.inviteType === CompanyRelationshipType.Supplier
              ? 'supplier'
              : 'customer',
        });
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

  deleteAllByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
    },
    CompanyRelationshipEntity[]
  > = async (args, context, entityManager) => {
    const companyRelationshipRepository = this.getCompanyRelationshipRepository(
      entityManager
    );

    const relationships = await this.findByCompanyId(
      { companyId: args.companyId },
      context,
      entityManager
    );

    await companyRelationshipRepository.delete(relationships.map((e) => e.id));

    context.controllers.audit.saveAuditTrails(
      {
        auditTrails: relationships.map((relationship) => ({
          action: COMPANY_RELATIONSHIP_DELETED_ACTION,
          userId: context.user.id,
          previousPayload: JSON.stringify(relationship),
          currentPayload: undefined,
        })),
      },
      context,
      entityManager
    );

    return relationships;
  };

  networkSummary: ControllerFunctionAsync<
    Record<string, unknown>,
    NetworkSummary
  > = async (_, context) => {
    return this.companyRelationshipService.networkSummary(
      context.user.companyId
    );
  };
}
