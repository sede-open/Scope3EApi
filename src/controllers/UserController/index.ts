import { ApolloError } from 'apollo-server-express';
import { EntityManager, getManager, Repository } from 'typeorm';
import { adminsMustUseExampleEmailError } from '../../access/exceptions';
import {
  assertCurrentUserCanGrantRole,
  assertUserCanBeIssuedRole,
} from '../../access/utils';
import { getFlag } from '../../clients/LaunchDarklyClient';
import { getInviteLink } from '../../clients/NotificationClient/utils';
import { LaunchDarklyFlags } from '../../config';
import {
  USER_CREATED_ACTION,
  USER_DELETED_ACTION,
  USER_EDITED_ACTION,
} from '../../constants/audit';
import { CompanyEntity } from '../../entities/Company';
import { PreferencesEntity } from '../../entities/Preferences';
import { UserEntity, UserEntityWithRoles } from '../../entities/User';
import { RoleRepository } from '../../repositories/RoleRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { UserService } from '../../services/UserService';
import {
  AuthProvider,
  CompanyStatus,
  CreateCompanyUserInput,
  CreateUserInput,
  DeleteUserInput,
  EditCompanyUserInput,
  EditUserInput,
  OrderBy,
  ResendUserInviteToJoinEmailInput,
  ResentAkamaiInviteInput,
  RoleName,
  UpdateMeInput,
  UserStatus,
} from '../../types';
import { AKAMAI_USER_EXISTS_ERROR_NAME } from '../../utils/errors';
import { isPartOfSameCompany } from '../../utils/user';
import { ControllerFunctionAsync } from '../types';
import { getRepository } from '../utils';

// @TODO :: move this to a util file
const validateSortByColumn = (sortBy: string) => {
  const sortColumn = ['email', 'first_name', 'last_name', 'created_at'];
  if (sortColumn.indexOf(sortBy) == -1) {
    return 'id';
  }
  return sortBy;
};

export const INVALID_AUTH_PROVIDER_ERROR =
  'Invalid AuthProvider, PORT or AKAMAI';
export const NOTHING_TO_UPDATE_ERROR =
  'Updated fields already match db fields ';
export const USERS_EXISTS_ERROR = 'User not created (already exists)';
export const USERS_DOES_NOT_EXIST_ERROR = 'User doesnt exist';
export const COULD_NOT_UPDATE_USER = 'Could not update the user';
export const ROLE_DOES_NOT_EXIST_ERROR = 'Role does not exist';
export const NON_ABCD_ADMIN_ERROR =
  'Admin role can only be assigned to Example staff';
export const NON_ABCD_EMAIL_ERROR =
  'Only Example emails can be registered with Port';
export const ABCD_EMAIL_ERROR =
  'Example emails cannot be registered with Akamai';
export const NO_COMPANY_ID_ERROR =
  'External users need to associated with a company';
export const NO_COMPANY_ERROR = 'Company does not exist';
export const SENDER_NOT_EXIST_ERROR =
  'Invite sender does not exist or has been deleted';
export const RECIPIENT_NOT_EXIST_ERROR =
  'Invite recipient does not exist or has been deleted';
export const RECIPIENT_COMPANY_CREATED_ERROR =
  'Recipient company has been created by admin';
export const USER_COMPANY_CONFIRMED_ERROR =
  'User company has already responded to their invite';
export const INVITE_SENT_SUCCESS = 'Invite has been resent';
export const DELETE_USER_NOT_PART_OF_COMPANY_ERROR =
  'You can only delete users who are part of your company';
export const RESEND_INVITE_USER_NOT_PART_OF_COMPANY_ERROR =
  'You can re-invite users who are part of your company';
export const WRONG_AUTH_PROVIDER_ERROR =
  'You cannot resend an invite to this user';

export class UserController {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private companyRepository: Repository<CompanyEntity>,
    private preferencesRepository: Repository<PreferencesEntity>,
    private userService: UserService
  ) {}

  private getUserRepository = (entityManager?: EntityManager) => {
    if (entityManager) {
      return entityManager.getCustomRepository(UserRepository);
    }
    return this.userRepository;
  };

  private getPreferencesRepository = (entityManager?: EntityManager) => {
    return getRepository(
      PreferencesEntity,
      this.preferencesRepository,
      entityManager
    );
  };

  findAll: ControllerFunctionAsync<
    {
      sortBy: string;
      orderBy?: OrderBy;
      limit: number;
      offset: number;
    },
    [UserEntity[], number]
  > = async (args) => {
    const orderBy = args.orderBy || 'DESC';
    const sortBy = validateSortByColumn(args.sortBy);

    const results = this.userRepository
      .createQueryBuilder('USER')
      .where({ isDeleted: false })
      .addOrderBy(sortBy, orderBy)
      .offset(args.offset)
      .limit(args.limit)
      .getManyAndCount();

    return results;
  };

  findByEmail: ControllerFunctionAsync<
    {
      email: string;
    },
    UserEntity | undefined
  > = async ({ email }) => {
    return this.userRepository.findOne({
      where: { email, isDeleted: false },
    });
  };

  findAllByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
      roleNames?: RoleName[];
    },
    UserEntity[]
  > = async ({ companyId, roleNames }, context, entityManager) => {
    const userRepository = this.getUserRepository(entityManager);

    return userRepository.companyUsers([companyId], roleNames);
  };

  findById: ControllerFunctionAsync<
    {
      id: string;
    },
    UserEntity | undefined
  > = async ({ id }) => {
    return this.userRepository.findOne({
      where: { id, isDeleted: false },
    });
  };

  createUserByCompanyInvitation: ControllerFunctionAsync<
    {
      firstName: string;
      lastName: string;
      email: string;
      roleName: RoleName;
      companyId?: string;
      authProvider: AuthProvider;
    },
    UserEntity
  > = async (
    { email: rawEmail, roleName, firstName, lastName, authProvider, companyId },
    context,
    entityManager
  ) => {
    const userRepository = this.getUserRepository(entityManager);

    const email = rawEmail.toLowerCase();
    const existingUser = await userRepository.findOne({
      email,
    });

    if (existingUser) {
      throw new ApolloError(USERS_EXISTS_ERROR);
    }

    const roleAssignment = await context.controllers.role.findByName(
      {
        name: roleName,
      },
      context,
      entityManager
    );

    if (!roleAssignment) {
      throw new ApolloError(ROLE_DOES_NOT_EXIST_ERROR);
    }

    const user = new UserEntity({
      email,
      firstName,
      lastName,
      authProvider,
      companyId,
      status: UserStatus.Pending,
    });

    user.roles = await this.roleRepository.findNewRoleSet(
      roleAssignment.name,
      user
    );

    const newUser = await userRepository.save(user, {
      data: { inviter: context.user },
    });

    await this.createNewUserPreference(
      { userId: newUser.id },
      context,
      entityManager
    );

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_CREATED_ACTION,
        currentPayload: JSON.stringify({
          id: newUser.id,
          authProvider: newUser.authProvider,
          status: newUser.status,
        }),
      },
      context,
      entityManager
    );

    return newUser;
  };

  createUserByCompanyMember: ControllerFunctionAsync<
    CreateCompanyUserInput,
    UserEntity
  > = async (
    {
      email: rawEmail,
      firstName,
      lastName,
      authProvider,
      expertiseDomain,
      companyId,
      roleName,
    },
    context,
    entityManager
  ) => {
    const currentUserRoles = context.user.roles?.map((role) => role.name) ?? [];

    const userRepository = this.getUserRepository(entityManager);

    const email = rawEmail.toLowerCase();
    const existingUser = await userRepository.findOne({
      email,
    });

    if (existingUser) {
      throw new ApolloError(USERS_EXISTS_ERROR);
    }

    const user = new UserEntity({
      email,
      firstName,
      lastName,
      authProvider,
      expertiseDomain,
      companyId,
      status: UserStatus.Pending,
    });

    assertCurrentUserCanGrantRole({
      currentUserRoles,
      targetUserRoles: null,
      userIsGranting: roleName,
    });
    assertUserCanBeIssuedRole({
      email,
      userIsBeingGranted: roleName,
      exception: adminsMustUseExampleEmailError(),
    });

    user.roles = await this.roleRepository.findNewRoleSet(roleName, user);

    let alreadyExistsInAkamai = false;
    try {
      await context.clients.akamai.register({
        email,
        firstName,
        lastName,
      });
    } catch (err) {
      if (err.name === AKAMAI_USER_EXISTS_ERROR_NAME) {
        alreadyExistsInAkamai = true;
      } else {
        // any other Akamai error should fail user creation
        throw new ApolloError(err);
      }
    }

    const newUser = await userRepository.save(user);

    await this.createNewUserPreference(
      { userId: newUser.id },
      context,
      entityManager
    );

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_CREATED_ACTION,
        currentPayload: JSON.stringify({
          id: newUser.id,
          authProvider: newUser.authProvider,
          status: newUser.status,
        }),
      },
      context,
      entityManager
    );

    if (alreadyExistsInAkamai) {
      context.clients.notification.notifyExistingAkamaiUserWelcome({
        recipient: user,
      });
    } else {
      context.clients.notification.notifyNewAkamaiUserWelcome({
        recipient: user,
      });
    }
    return newUser;
  };

  editUserByCompanyMember: ControllerFunctionAsync<
    EditCompanyUserInput,
    UserEntity
  > = async ({ email: rawEmail, firstName, lastName, roleName }, context) => {
    const currentUserRoles = context.user.roles?.map((role) => role.name) ?? [];
    const userCompanyId = context.user.companyId;
    const userEmail = rawEmail.toLowerCase();
    const existingUser = (await this.userRepository.findOne(
      {
        email: userEmail,
        isDeleted: false,
        companyId: userCompanyId,
      },
      {
        relations: ['roles'],
      }
    )) as UserEntityWithRoles | undefined;

    if (!existingUser) {
      throw new ApolloError(USERS_DOES_NOT_EXIST_ERROR);
    }

    // for audit trail
    const previousPayload: { [key: string]: unknown } = {
      id: existingUser.id,
      authProvider: existingUser.authProvider,
    };
    const currentPayload: { [key: string]: unknown } = {
      id: existingUser.id,
      authProvider: existingUser.authProvider,
    };

    let lastUpdatedFields = false;
    if (firstName != null && existingUser.firstName !== firstName) {
      existingUser.firstName = firstName;
      lastUpdatedFields = true;
    }
    if (lastName != null && existingUser.lastName !== lastName) {
      existingUser.lastName = lastName;
      lastUpdatedFields = true;
    }

    previousPayload.roles = [...existingUser.roles];

    assertCurrentUserCanGrantRole({
      currentUserRoles,
      targetUserRoles: existingUser.roles.map((role) => role.name),
      userIsGranting: roleName,
    });
    assertUserCanBeIssuedRole({
      email: userEmail,
      userIsBeingGranted: roleName,
      exception: adminsMustUseExampleEmailError(),
    });

    const newRoles = await this.roleRepository.findNewRoleSet(
      roleName,
      existingUser
    );

    existingUser.roles = newRoles;
    currentPayload.roles = newRoles;

    if (!lastUpdatedFields) {
      throw new ApolloError(NOTHING_TO_UPDATE_ERROR);
    }

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_EDITED_ACTION,
        previousPayload: JSON.stringify(previousPayload),
        currentPayload: JSON.stringify(currentPayload),
      },
      context
    );

    // Trigger UPDATE on the USER table to trigger the subscriber in case of a role change
    existingUser.updatedAt = new Date();

    return this.userRepository.save(existingUser);
  };

  createUserByAdmin: ControllerFunctionAsync<
    CreateUserInput,
    UserEntity
  > = async (args, context) => {
    const currentUserRoles = context.user.roles?.map((role) => role.name) ?? [];
    const email = args.email.toLowerCase();

    const existingUser = await this.userRepository.findOne({
      email,
    });

    if (existingUser) {
      throw new ApolloError(USERS_EXISTS_ERROR);
    }

    assertCurrentUserCanGrantRole({
      currentUserRoles,
      targetUserRoles: null,
      userIsGranting: args.roleName,
    });
    assertUserCanBeIssuedRole({
      email,
      userIsBeingGranted: args.roleName,
      exception: adminsMustUseExampleEmailError(),
    });

    switch (args.authProvider) {
      case AuthProvider.Port:
        return this.createExampleUserByAdmin({ ...args }, context);
      case AuthProvider.Akamai:
        return this.createExternalUserByAdmin({ ...args }, context);
      default:
        throw new ApolloError(INVALID_AUTH_PROVIDER_ERROR);
    }
  };

  createExampleUserByAdmin: ControllerFunctionAsync<
    CreateUserInput,
    UserEntity
  > = async (
    { email: rawEmail, firstName, lastName, authProvider, roleName, companyId },
    context
  ) => {
    if (!rawEmail.endsWith('@example.com')) {
      throw new ApolloError(NON_ABCD_EMAIL_ERROR);
    }

    const newUser = await this.userService.create({
      email: rawEmail.toLowerCase(),
      firstName,
      lastName,
      companyId,
      authProvider,
      status: UserStatus.Pending,
      isDeleted: false,
    });
    newUser.roles = await this.roleRepository.findNewRoleSet(roleName, newUser);
    await newUser.save();
    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_CREATED_ACTION,
        currentPayload: JSON.stringify({
          id: newUser.id,
          authProvider: newUser.authProvider,
          roles: newUser.roles,
        }),
      },
      context
    );

    return newUser;
  };

  createExternalUserByAdmin: ControllerFunctionAsync<
    CreateUserInput,
    UserEntity
  > = async (
    {
      email,
      roleName,
      companyId,
      firstName,
      lastName,
      authProvider,
      expertiseDomain,
    },
    context
  ) => {
    if (email.endsWith('@example.com')) {
      throw new ApolloError(ABCD_EMAIL_ERROR);
    }

    if (roleName === RoleName.Admin) {
      throw new ApolloError(NON_ABCD_ADMIN_ERROR);
    }

    if (!companyId) {
      throw new ApolloError(NO_COMPANY_ID_ERROR);
    }

    const companyAssignment = await this.companyRepository.findOne(companyId);

    if (!companyAssignment) {
      throw new ApolloError(NO_COMPANY_ERROR);
    }

    const user = new UserEntity({
      email,
      firstName,
      lastName,
      authProvider,
      companyId,
      status: UserStatus.Pending,
      expertiseDomain,
    });

    user.roles = await this.roleRepository.findNewRoleSet(roleName, user);

    let alreadyExistsInAkamai = false;
    try {
      await context.clients.akamai.register({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (err) {
      if (err.name === AKAMAI_USER_EXISTS_ERROR_NAME) {
        alreadyExistsInAkamai = true;
      } else {
        // any other Akamai error should fail user creation
        throw new ApolloError(err);
      }
    }

    const newUser = await this.userRepository.save(user);

    await this.createNewUserPreference({ userId: newUser.id }, context);

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_CREATED_ACTION,
        currentPayload: JSON.stringify({
          id: newUser.id,
          authProvider: newUser.authProvider,
          company: newUser.company,
        }),
      },
      context
    );

    if (alreadyExistsInAkamai) {
      context.clients.notification.notifyExistingAkamaiUserWelcome({
        recipient: user,
      });
    } else {
      context.clients.notification.notifyNewAkamaiUserWelcome({
        recipient: user,
      });
    }

    return newUser;
  };

  editUser: ControllerFunctionAsync<EditUserInput, UserEntity> = async (
    { email: rawEmail, firstName, lastName, roleName, companyId },
    context
  ) => {
    const currentUserRoles = context.user.roles?.map((role) => role.name) ?? [];

    const userEmail = rawEmail.toLowerCase();
    const existingUser = await this.userRepository.findOne(
      {
        email: userEmail,
        isDeleted: false,
      },
      {
        relations: ['roles'],
      }
    );

    if (!existingUser) {
      throw new ApolloError(USERS_DOES_NOT_EXIST_ERROR);
    }

    const previousPayload: { [key: string]: unknown } = {
      id: existingUser.id,
      authProvider: existingUser.authProvider,
    };
    const currentPayload: { [key: string]: unknown } = {
      id: existingUser.id,
      authProvider: existingUser.authProvider,
    };

    // Trigger UPDATE on the USER table to trigger the subscriber in case of a role change
    existingUser.updatedAt = new Date();

    if (firstName != null && existingUser.firstName !== firstName) {
      existingUser.firstName = firstName;
    }
    if (lastName != null && existingUser.lastName !== lastName) {
      existingUser.lastName = lastName;
    }
    if (companyId != null && existingUser.companyId !== companyId) {
      const companyAssignment = await this.companyRepository.findOne(companyId);

      if (!companyAssignment) {
        throw new ApolloError(NO_COMPANY_ERROR);
      }

      previousPayload.company = existingUser.company;
      currentPayload.company = companyAssignment;

      existingUser.company = companyAssignment;
    }

    assertCurrentUserCanGrantRole({
      currentUserRoles,
      targetUserRoles: existingUser.roles?.map((role) => role.name) ?? [],
      userIsGranting: roleName,
    });
    assertUserCanBeIssuedRole({
      email: userEmail,
      userIsBeingGranted: roleName,
      exception: adminsMustUseExampleEmailError(),
    });

    existingUser.roles = await this.roleRepository.findNewRoleSet(
      roleName,
      existingUser
    );
    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_EDITED_ACTION,
        previousPayload: JSON.stringify(previousPayload),
        currentPayload: JSON.stringify(currentPayload),
      },
      context
    );

    return this.userRepository.save(existingUser);
  };

  deleteUser: ControllerFunctionAsync<DeleteUserInput, string> = async (
    args,
    context
  ) => {
    const userToRemove = await this.userRepository.findOne({
      id: args.id,
      isDeleted: false,
    });
    const emailToRemoveFromAkamai =
      userToRemove?.authProvider === AuthProvider.Akamai
        ? userToRemove?.email
        : undefined;

    if (!userToRemove) {
      throw new ApolloError(USERS_DOES_NOT_EXIST_ERROR);
    }

    if (
      !context.user.roles.some((role) => role.name === RoleName.Admin) &&
      !isPartOfSameCompany({
        companyId: userToRemove.companyId,
        userCompanyId: context.user.companyId,
      })
    ) {
      throw new ApolloError(DELETE_USER_NOT_PART_OF_COMPANY_ERROR);
    }

    const [{ id }] = await this.userRepository.softDeleteUsers([userToRemove]);

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_DELETED_ACTION,
        previousPayload: JSON.stringify({ id }),
        currentPayload: JSON.stringify({ id }),
      },
      context
    );

    if (emailToRemoveFromAkamai) {
      context.clients.notification.notifyUserRemovedFromCompany({
        removedUserEmail: emailToRemoveFromAkamai,
      });
    }

    return id;
  };

  deleteByCompanyId: ControllerFunctionAsync<
    { companyId: string },
    void
  > = async (args, context, entityManager) => {
    const userRepository = this.getUserRepository(entityManager);
    const users = await userRepository.find({
      companyId: args.companyId,
      isDeleted: false,
    });

    const updatedUsers = await userRepository.softDeleteUsers(users);

    await context.controllers.audit.saveAuditTrails(
      {
        auditTrails: updatedUsers.map((user) => ({
          userId: context.user.id,
          action: USER_DELETED_ACTION,
          previousPayload: JSON.stringify({ id: user.id }),
          currentPayload: JSON.stringify({ id: user.id }),
        })),
      },
      context,
      entityManager
    );
  };

  resendInviteToJoinEmail: ControllerFunctionAsync<
    ResendUserInviteToJoinEmailInput,
    string
  > = async (args, context) => {
    const userRepository = this.getUserRepository();

    const recipient = await userRepository.findOne({
      where: { id: args.userId, isDeleted: false },
      relations: ['company'],
    });

    if (!recipient) {
      throw new ApolloError(RECIPIENT_NOT_EXIST_ERROR);
    }

    if (!recipient.company?.createdBy) {
      throw new ApolloError(RECIPIENT_COMPANY_CREATED_ERROR);
    }

    if (recipient.company.status !== CompanyStatus.PendingUserConfirmation) {
      throw new ApolloError(USER_COMPANY_CONFIRMED_ERROR);
    }

    const sender = await userRepository.findOne({
      where: { id: recipient.company.createdBy, isDeleted: false },
      relations: ['company'],
    });

    if (!sender) {
      throw new ApolloError(SENDER_NOT_EXIST_ERROR);
    }

    const isHubspotInviteToJoinWorkflowEnabled = await getFlag(
      LaunchDarklyFlags.IS_HUBSPOT_INVITE_TO_JOIN_WORKFLOW_ENABLED,
      false
    );

    if (isHubspotInviteToJoinWorkflowEnabled) {
      await context.clients.hubspotEmail.resendInviteToJoinEmail({
        recipient,
        inviterName: `${sender.firstName} ${sender.lastName}`,
        inviterCompanyName: sender.company?.name ?? '',
        invitationLink: getInviteLink(recipient),
      });
    } else {
      await context.clients.notification.notifyOfInviteToJoin({
        sender,
        recipient,
      });
    }

    return INVITE_SENT_SUCCESS;
  };

  activateTransaction: ControllerFunctionAsync<undefined, UserEntity> = async (
    args,
    context
  ) => {
    const manager = getManager();

    return manager.transaction(async (entityManager: EntityManager) => {
      return this.activate(args, context, entityManager);
    });
  };

  activate: ControllerFunctionAsync<undefined, UserEntity> = async (
    _,
    context,
    entityManager
  ) => {
    const userRepository = this.getUserRepository(entityManager);

    const userToUpdate = await userRepository.findOne(context.user.id);

    if (!userToUpdate) {
      throw new ApolloError(USERS_DOES_NOT_EXIST_ERROR);
    }

    if (userToUpdate.status === UserStatus.Active) {
      return userToUpdate;
    }

    const previousPayload = {
      id: userToUpdate.id,
      authProvider: userToUpdate.authProvider,
      status: userToUpdate.status,
    };

    userToUpdate.status = UserStatus.Active;
    const updatedUser = await userRepository.save(userToUpdate);

    const currentPayload = {
      id: updatedUser.id,
      authProvider: updatedUser.authProvider,
      status: updatedUser.status,
    };

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: USER_EDITED_ACTION,
        previousPayload: JSON.stringify(previousPayload),
        currentPayload: JSON.stringify(currentPayload),
      },
      context,
      entityManager
    );

    // NOTE :: company should also be activated if not already active
    if (
      context.user.companyId &&
      context.user.company?.status === CompanyStatus.PendingUserActivation
    ) {
      await context.controllers.company.updateCompanyStatus(
        { id: context.user.companyId, status: CompanyStatus.Active },
        context,
        entityManager
      );
    }

    return updatedUser;
  };

  updateMeTransaction: ControllerFunctionAsync<UpdateMeInput, UserEntity> = (
    args,
    context
  ) => {
    const manager = getManager();

    return manager.transaction(async (entityManager) => {
      return this.updateMe(args, context, entityManager);
    });
  };

  updateMe: ControllerFunctionAsync<UpdateMeInput, UserEntity> = async (
    args,
    context,
    entityManager
  ) => {
    const userRepository = this.getUserRepository(entityManager);

    const user = await userRepository.findOne({
      where: {
        id: context.user.id,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new ApolloError(USERS_DOES_NOT_EXIST_ERROR);
    }

    const previousPayload: UpdateMeInput = {};
    const currentPayload: UpdateMeInput = {};

    const firstName = args.firstName?.trim();
    const lastName = args.lastName?.trim();
    const { expertiseDomain } = args;

    let updatingValue = false;
    if (firstName && firstName !== user.firstName) {
      previousPayload.firstName = user.firstName;
      currentPayload.firstName = firstName;
      user.firstName = firstName;
      updatingValue = true;
    }
    if (lastName && lastName !== user.lastName) {
      previousPayload.lastName = user.lastName;
      currentPayload.lastName = lastName;
      user.lastName = lastName;
      updatingValue = true;
    }
    if (expertiseDomain && expertiseDomain !== user.expertiseDomain) {
      previousPayload.expertiseDomain = user.expertiseDomain;
      currentPayload.expertiseDomain = expertiseDomain;
      user.expertiseDomain = expertiseDomain;
      updatingValue = true;
    }

    if (!updatingValue) {
      throw new ApolloError(NOTHING_TO_UPDATE_ERROR);
    }

    const isUpdatingAkamaiFields = Boolean(
      currentPayload.firstName || currentPayload.lastName
    );
    const isExampleUser = user.email.endsWith('@example.com');

    if (isUpdatingAkamaiFields && !isExampleUser) {
      await context.clients.akamai.updateProfile(
        context.user.id,
        {
          firstName: currentPayload.firstName ?? user.firstName,
          lastName: currentPayload.lastName ?? user.lastName,
          emailAddress: context.user.email,
        },
        context.accessToken as string
      );
    }

    await context.controllers.audit.saveAuditTrail(
      {
        userId: user.id,
        action: USER_EDITED_ACTION,
        previousPayload: JSON.stringify({ id: user.id, ...previousPayload }),
        currentPayload: JSON.stringify({ id: user.id, ...currentPayload }),
      },
      context,
      entityManager
    );

    return userRepository.save(user);
  };

  private createNewUserPreference: ControllerFunctionAsync<
    { userId: string },
    void
  > = async (args, _, entityManager) => {
    const preferencesRepository = this.getPreferencesRepository(entityManager);
    const preferences = new PreferencesEntity();
    preferences.userId = args.userId;
    await preferencesRepository.save(preferences);
  };

  resendAkamaiInvite: ControllerFunctionAsync<
    ResentAkamaiInviteInput,
    string
  > = async (args, context, transactionalEntityManager) => {
    const userRepository = this.getUserRepository(transactionalEntityManager);

    const user = await userRepository.findOne({
      where: { id: args.userId, isDeleted: false },
    });

    if (!user) {
      throw new ApolloError(RECIPIENT_NOT_EXIST_ERROR);
    }

    if (user.authProvider !== AuthProvider.Akamai) {
      throw new ApolloError(WRONG_AUTH_PROVIDER_ERROR);
    }

    if (
      !context.user.roles.some((role) => role.name === RoleName.Admin) &&
      !isPartOfSameCompany({
        companyId: user.companyId,
        userCompanyId: context.user.companyId,
      })
    ) {
      throw new ApolloError(RESEND_INVITE_USER_NOT_PART_OF_COMPANY_ERROR);
    }

    await context.clients.akamai.resendInvite(user.email);

    return INVITE_SENT_SUCCESS;
  };
}
