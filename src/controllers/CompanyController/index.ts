import { EntityManager, getManager, Repository } from 'typeorm';
import {
  OrderBy,
  DnBTypeaheadResult,
  CompanyStatus,
  CompanySectorType,
  UpdateCompanyStatusInput,
  AcceptCompanyInviteInput,
  RoleName,
  DeclineCompanyInviteInput,
  VetoCompanyInput,
  ApproveCompanyInput,
  CompaniesBenchmarkInput,
  CompanyBenchmarkRes,
  CompanyProfile,
} from '../../types';
import { ControllerFunctionAsync } from '../types';
import { CompanyEntity } from '../../entities/Company';
import { ApolloError } from 'apollo-server-express';
import { getRepository } from '../utils';
import {
  COMPANY_CREATED_ACTION,
  COMPANY_UPDATED_ACTION,
} from '../../constants/audit';
import { isCompanyStatusChangeValid } from './utils';
import { AKAMAI_USER_EXISTS_ERROR_NAME } from '../../utils/errors';
import { UserRepository } from '../../repositories/UserRepository';
import { Flags, getConfig } from '../../config';
import {
  USER_COMPANY_CANNOT_ACCESS,
  USER_COMPANY_ERROR,
} from '../../errors/commonErrorMessages';
import { IContext } from '../../apolloContext';
import { CompanyService } from '../../services/CompanyService';

export const COMPANY_DOESNT_EXIST = 'Company does not exist.';
export const COMPANY_EXISTS_ERROR = 'Company already exists';
export const DNB_PROFILE_ERROR = 'Could not retrieve company profile from D&B';
export const ADMIN_CREATED_COMPANY = 'Company was created by XYZ admin';
export const COMPANY_INVITER_NOT_ACTIVE = 'Inviter is no longer active';
export const RESEND_INVITE_SUCCESS = 'Invite has been resent';
export const ACCEPT_INVITE_SUCCESS = 'Invite has been accepted';
export const DECLINE_INVITE_SUCCESS = 'Invite has been declined';
export const COMPANY_STATUS_CHANGE_INVALID = 'Unable to change company status';

export class CompanyController {
  constructor(
    private companyRepository: Repository<CompanyEntity>,
    private userRepository: UserRepository,
    private companyService: CompanyService
  ) {}

  private getCompanyRepository = (entityManager?: EntityManager) => {
    return getRepository(CompanyEntity, this.companyRepository, entityManager);
  };

  findAndCount: ControllerFunctionAsync<
    { limit: number; offset: number },
    { data: CompanyEntity[]; total: number }
  > = async ({ limit, offset }) => {
    const [data, total] = await this.companyRepository.findAndCount({
      order: { name: OrderBy.Asc },
      take: limit,
      skip: offset,
    });

    return { data, total };
  };

  findById: ControllerFunctionAsync<
    {
      id: string;
    },
    CompanyEntity | undefined
  > = async (args) => {
    const [company] = await this.companyRepository.find({
      where: { id: args.id },
    });
    return company;
  };

  findByDuns: ControllerFunctionAsync<
    {
      duns: string;
    },
    CompanyEntity | undefined
  > = async (args, _, entityManager) => {
    const companyRepository = this.getCompanyRepository(entityManager);

    const [company] = await companyRepository.find({
      where: { duns: args.duns },
    });

    return company;
  };

  searchForDnBCompanies: ControllerFunctionAsync<
    {
      searchTerm: string;
    },
    DnBTypeaheadResult[]
  > = async (args, context) => {
    return context.services.dnb.typeahead(args.searchTerm);
  };

  create: ControllerFunctionAsync<
    {
      duns: string;
      businessSection?: string;
      subSector?: string;
      location?: string;
    },
    CompanyEntity
  > = async (
    { businessSection, subSector, location, duns },
    context,
    entityManager
  ) => {
    const companyDnBProfile = await context.services.dnb.companyByDuns(duns);

    if (!companyDnBProfile) {
      throw new ApolloError(DNB_PROFILE_ERROR);
    }

    const companyRepository = this.getCompanyRepository(entityManager);

    let existingCompany;
    if (duns) {
      existingCompany = await this.findByDuns({ duns }, context, entityManager);
    }

    if (existingCompany) {
      throw new ApolloError(COMPANY_EXISTS_ERROR);
    }

    const company = new CompanyEntity();
    company.name = companyDnBProfile.name;
    company.duns = duns;
    company.businessSection = businessSection;
    company.subSector = subSector;
    company.location = location ?? ''; // @TODO :: remove the string after location is NULLABLE
    company.dnbRegion = companyDnBProfile.region;
    company.dnbCountry = companyDnBProfile.countryName;
    company.dnbCountryIso = companyDnBProfile.countryIso;
    company.dnbAddressLineOne = companyDnBProfile.addressLineOne;
    company.dnbAddressLineTwo = companyDnBProfile.addressLineTwo;
    company.dnbPostalCode = companyDnBProfile.postalCode;
    company.status = CompanyStatus.PendingUserConfirmation;
    company.createdBy = context.user.id;

    const newCompany = await companyRepository.save(company, {
      // we create the company and the user in the same transaction, that's why we need to skip the listeners here,
      // otherwise we will have duplicate companies in HubSpot
      listeners: false,
    });

    if (companyDnBProfile.primarySector) {
      const savedPrimarySector = await context.controllers.sector.findOrCreateFromDnBProfile(
        {
          sector: companyDnBProfile.primarySector,
        },
        context,
        entityManager
      );

      if (savedPrimarySector) {
        await context.controllers.companySector.create(
          {
            sectorId: savedPrimarySector.id,
            companyId: company.id,
            sectorType: CompanySectorType.Primary,
          },
          context,
          entityManager
        );
      }
    }

    if (companyDnBProfile.secondarySector) {
      const savedSecondarySector = await context.controllers.sector.findOrCreateFromDnBProfile(
        {
          sector: companyDnBProfile.secondarySector,
        },
        context,
        entityManager
      );

      if (savedSecondarySector) {
        await context.controllers.companySector.create(
          {
            sectorId: savedSecondarySector.id,
            companyId: company.id,
            sectorType: CompanySectorType.Secondary,
          },
          context,
          entityManager
        );
      }
    }

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: COMPANY_CREATED_ACTION,
        currentPayload: JSON.stringify(newCompany),
      },
      context,
      entityManager
    );

    return newCompany;
  };

  updateCompanyStatus: ControllerFunctionAsync<
    UpdateCompanyStatusInput,
    CompanyEntity
  > = async (args, context, entityManager) => {
    const companyRepository = this.getCompanyRepository(entityManager);

    const company = await companyRepository.findOne({
      where: { id: args.id },
    });

    if (!company) {
      throw new ApolloError(COMPANY_DOESNT_EXIST);
    }

    if (
      !isCompanyStatusChangeValid({
        currentStatus: company.status,
        nextStatus: args.status,
      })
    ) {
      throw new ApolloError(COMPANY_STATUS_CHANGE_INVALID);
    }

    // for audit trail
    const previousPayload: { [key: string]: unknown } = {
      id: company.id,
      name: company.name,
      location: company.location,
      businessSection: company.businessSection,
      subSector: company.subSector,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      reviewedAt: company.reviewedAt,
      updatedBy: company.updatedBy,
      duns: company.duns,
      dnbRegion: company.dnbRegion,
      dnbCountry: company.dnbCountry,
      dnbCountryIso: company.dnbCountryIso,
      dnbAddressLineOne: company.dnbAddressLineOne,
      dnbAddressLineTwo: company.dnbAddressLineTwo,
      dnbPostalCode: company.dnbPostalCode,
      status: company.status,
    };

    company.updatedBy = context.user.id;

    if (
      company.status === CompanyStatus.VettingInProgress &&
      (args.status === CompanyStatus.PendingUserActivation ||
        args.status === CompanyStatus.Vetoed)
    ) {
      company.reviewedAt = new Date();
    }

    if (args.status !== company.status) {
      company.status = args.status;
    }

    const updatedCompany = await companyRepository.save(company);

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: COMPANY_UPDATED_ACTION,
        currentPayload: JSON.stringify(updatedCompany),
        previousPayload: JSON.stringify(previousPayload),
      },
      context,
      entityManager
    );

    return updatedCompany;
  };

  acceptInvite: ControllerFunctionAsync<
    AcceptCompanyInviteInput,
    string
  > = async (args, context) => {
    if (context.user.company?.id !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const updatedCompany = await this.updateCompanyStatus(
      {
        id: args.companyId,
        status: CompanyStatus.VettingInProgress,
      },
      context
    );

    await context.services.jwt.saveUsedToken({
      token: context.token,
      userId: context.user.id,
    });

    context.clients.notification.notifyOfCompanyToBeVetted({
      company: updatedCompany,
    });

    return ACCEPT_INVITE_SUCCESS;
  };

  declineInviteTransaction: ControllerFunctionAsync<
    DeclineCompanyInviteInput,
    string
  > = async (args, context) => {
    const manager = getManager();

    return manager.transaction(async (entityManager: EntityManager) => {
      return this.declineInvite(args, context, entityManager);
    });
  };

  declineInvite: ControllerFunctionAsync<
    DeclineCompanyInviteInput,
    string
  > = async (args, context, entityManager) => {
    if (context.user.company?.id !== args.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    const updatedCompany = await this.updateCompanyStatus(
      {
        id: args.companyId,
        status: CompanyStatus.InvitationDeclined,
      },
      context,
      entityManager
    );

    const deletedRelationships = await context.controllers.companyRelationship.deleteAllByCompanyId(
      {
        companyId: args.companyId,
      },
      context,
      entityManager
    );

    const companiesToNotify = deletedRelationships.map(
      ({ customerId, supplierId }) => {
        return supplierId !== args.companyId ? supplierId : customerId;
      }
    );

    await context.controllers.user.deleteByCompanyId(
      { companyId: args.companyId },
      context,
      entityManager
    );

    const usersToNotify = await this.userRepository.companyUsers(
      companiesToNotify,
      [RoleName.SupplierEditor],
      entityManager
    );

    const { flags } = getConfig();

    const notificationPromises = flags[
      Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED
    ]
      ? usersToNotify.map((user) => {
          return context.clients.hubspotEmail.sendJoiningInvitationDeclined({
            inviteeName: `${context.user.firstName} ${context.user.lastName}`,
            inviteeCompanyName: updatedCompany.name,
            declineReason: args.reason,
            recipient: user,
          });
        })
      : usersToNotify.map((user) => {
          return context.clients.notification.notifyOfDeclinedInvitation({
            declinee: context.user,
            declineeCompany: updatedCompany,
            declineReason: args.reason,
            recipient: user,
          });
        });

    await Promise.all(notificationPromises);

    await context.services.jwt.saveUsedToken({
      token: context.token,
      userId: context.user.id,
    });

    return DECLINE_INVITE_SUCCESS;
  };

  approveCompanyTransaction: ControllerFunctionAsync<
    ApproveCompanyInput,
    CompanyEntity
  > = async (args, context) => {
    const manager = getManager();

    return manager.transaction(async (entityManager: EntityManager) => {
      return this.approveCompany(args, context, entityManager);
    });
  };

  approveCompany: ControllerFunctionAsync<
    ApproveCompanyInput,
    CompanyEntity
  > = async (args, context, entityManager) => {
    // NOTE :: for now, there is only one user per pending company
    // but making the logic more flexible to handle multiples
    const pendingUsers = await context.controllers.user.findAllByCompanyId(
      {
        companyId: args.companyId,
      },
      context,
      entityManager
    );

    for (const user of pendingUsers) {
      try {
        await context.clients.akamai.register({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        context.clients.notification.notifyNewAkamaiUserWelcome({
          recipient: user,
        });
      } catch (err) {
        if (err.name === AKAMAI_USER_EXISTS_ERROR_NAME) {
          context.clients.notification.notifyExistingAkamaiUserWelcome({
            recipient: user,
          });
        } else {
          throw new ApolloError(err);
        }
      }
    }

    const updatedCompany = await this.updateCompanyStatus(
      {
        id: args.companyId,
        status: CompanyStatus.PendingUserActivation,
      },
      context,
      entityManager
    );

    return updatedCompany;
  };

  vetoCompanyTransaction: ControllerFunctionAsync<
    VetoCompanyInput,
    CompanyEntity
  > = async (args, context) => {
    const manager = getManager();

    return manager.transaction(async (entityManager: EntityManager) => {
      return this.vetoCompany(args, context, entityManager);
    });
  };

  vetoCompany: ControllerFunctionAsync<
    VetoCompanyInput,
    CompanyEntity
  > = async (args, context, entityManager) => {
    const updatedCompany = await this.updateCompanyStatus(
      {
        id: args.companyId,
        status: CompanyStatus.Vetoed,
      },
      context,
      entityManager
    );

    const inviteesToNotify = await context.controllers.user.findAllByCompanyId(
      {
        companyId: args.companyId,
      },
      context,
      entityManager
    );

    await context.controllers.user.deleteByCompanyId(
      { companyId: args.companyId },
      context,
      entityManager
    );

    const companyRelationships = await context.controllers.companyRelationship.findByCompanyId(
      {
        companyId: args.companyId,
      },
      context,
      entityManager
    );

    const companiesToNotify = companyRelationships.map(
      ({ customerId, supplierId }) => {
        return supplierId !== args.companyId ? supplierId : customerId;
      }
    );

    const invitersToNotify = await this.userRepository.companyUsers(
      companiesToNotify,
      [RoleName.SupplierEditor],
      entityManager
    );

    const { flags } = getConfig();

    const notifyInviter = flags[Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED]
      ? context.clients.hubspotEmail.sendUnableToInviteCompanyEmail
      : context.clients.notification.notifyInviterOfVetoedCompany;

    const unableToInviteCompanyPromises = invitersToNotify.map((user) => {
      return notifyInviter({
        recipient: user,
        // NOTE :: for now there can only be one invitee per company
        inviteeName: `${inviteesToNotify[0].firstName} ${inviteesToNotify[0].lastName}`,
        inviteeCompanyName: updatedCompany.name,
      });
    });

    const notifyInvitee = flags[Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED]
      ? context.clients.hubspotEmail.sendRegistrationUnsuccessfulEmail
      : context.clients.notification.notifyInviteeOfVetoedCompany;
    const registrationUnsuccessfulPromises = inviteesToNotify.map((user) => {
      return notifyInvitee({ recipient: user });
    });
    await Promise.all(
      unableToInviteCompanyPromises.concat(registrationUnsuccessfulPromises)
    );

    return updatedCompany;
  };

  async companiesBenchmark(
    args: CompaniesBenchmarkInput,
    context: IContext
  ): Promise<CompanyBenchmarkRes> {
    return this.companyService.getCompaniesBenchmark(
      context.user.companyId,
      args
    );
  }

  async companyProfile(
    args: { companyId: string },
    context: IContext
  ): Promise<CompanyProfile> {
    if (context.user.companyId === args.companyId) {
      throw new ApolloError(USER_COMPANY_CANNOT_ACCESS);
    }
    return this.companyService.getCompanyProfile(
      args.companyId,
      context.user.companyId
    );
  }
}
