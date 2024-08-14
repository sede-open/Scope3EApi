import { IContext } from '../apolloContext';
import {
  getLaunchDarklyUser,
  getSecureHash,
} from '../clients/LaunchDarklyClient';
import { RoleEntity } from '../entities/Role';
import {
  Me,
  RoleName,
  CreateUserInput,
  Company,
  Preferences,
  MutationUpdateMeArgs,
} from '../types';
import { ResolverFunction } from './types';

const isAdmin = (user: IContext['user']) => {
  const userRoles = user.roles.map((role) => role.name);
  return userRoles.includes(RoleName.Admin);
};
const isAccountManager = (user: IContext['user']) => {
  const userRoles = user.roles.map((role) => role.name);
  return userRoles.includes(RoleName.AccountManager);
};
const isEditor = (user: IContext['user']) => {
  const userRoles = user.roles.map((role) => role.name);
  return userRoles.includes(RoleName.SupplierEditor);
};
const isViewer = (user: IContext['user']) => {
  const userRoles = user.roles.map((role) => role.name);
  return userRoles.includes(RoleName.SupplierViewer);
};

type MeResolverType = {
  Query: {
    me: ResolverFunction<undefined, Me>;
  };
  Mutation: {
    updateMe: ResolverFunction<MutationUpdateMeArgs, Me>;
  };
  Me: {
    roles: ResolverFunction<undefined, RoleEntity[]>;
    company: ResolverFunction<{ input: CreateUserInput }, Company | undefined>;
    canViewUsersAdminDashboard: ResolverFunction<undefined, boolean>;
    canViewCompaniesAdminDashboard: ResolverFunction<undefined, boolean>;
    canViewSupplyDashboard: ResolverFunction<undefined, boolean>;
    canEditSupplyDashboard: ResolverFunction<undefined, boolean>;
    canViewCompanyRelationships: ResolverFunction<undefined, boolean>;
    canEditCompanyRelationships: ResolverFunction<undefined, boolean>;
    canViewEmissionAllocations: ResolverFunction<undefined, boolean>;
    canEditEmissionAllocations: ResolverFunction<undefined, boolean>;
    canEditCompanySectors: ResolverFunction<undefined, boolean>;
    canInviteNewCompanyMembers: ResolverFunction<undefined, boolean>;
    canEditCompanyMembers: ResolverFunction<undefined, boolean>;
    canRemoveCompanyMembers: ResolverFunction<undefined, boolean>;
    canSubmitDataPrivacyInfo: ResolverFunction<undefined, boolean>;
    preferences: ResolverFunction<undefined, Preferences | undefined>;
  };
};

export const meResolvers: MeResolverType = {
  Query: {
    async me(_, args, context) {
      const launchDarklyHash = await getSecureHash(
        getLaunchDarklyUser(context.user)
      );
      return {
        ...context.user,
        // this is just for typescript for now
        roles: [],
        canViewUsersAdminDashboard: false,
        canViewCompaniesAdminDashboard: false,
        canViewSupplyDashboard: false,
        canEditSupplyDashboard: false,
        canViewCompanyRelationships: false,
        canEditCompanyRelationships: false,
        canViewEmissionAllocations: false,
        canEditEmissionAllocations: false,
        canEditCompanySectors: false,
        canInviteNewCompanyMembers: false,
        canEditCompanyMembers: false,
        canRemoveCompanyMembers: false,
        suppressTaskListPrompt: false,
        canSubmitDataPrivacyInfo: false,
        launchDarklyHash,
      };
    },
  },
  Mutation: {
    async updateMe(_, args, context) {
      const updatedUser = await context.controllers.user.updateMeTransaction(
        args.input,
        context
      );
      return {
        ...updatedUser,
        // this is just for typescript for now
        roles: [],
        canViewUsersAdminDashboard: false,
        canViewCompaniesAdminDashboard: false,
        canViewSupplyDashboard: false,
        canEditSupplyDashboard: false,
        canViewCompanyRelationships: false,
        canEditCompanyRelationships: false,
        canViewEmissionAllocations: false,
        canEditEmissionAllocations: false,
        canEditCompanySectors: false,
        canInviteNewCompanyMembers: false,
        canEditCompanyMembers: false,
        canRemoveCompanyMembers: false,
        suppressTaskListPrompt: false,
        canSubmitDataPrivacyInfo: false,
        launchDarklyHash: '',
      };
    },
  },
  Me: {
    async roles({ id: userId }, _, { loaders }) {
      return loaders.userRoles.load(userId);
    },
    async company({ companyId }, _, { loaders }) {
      if (companyId) {
        return loaders.company.load(companyId);
      }
      return undefined;
    },
    canViewUsersAdminDashboard: async (_, __, { user }) => isAdmin(user),
    canViewCompaniesAdminDashboard: async (_, __, { user }) => isAdmin(user),
    canViewSupplyDashboard: async (_, __, { user }) => isViewer(user),
    canEditSupplyDashboard: async (_, __, { user }) => isEditor(user),
    canViewCompanyRelationships: async (_, __, { user }) =>
      isViewer(user) || isAccountManager(user),
    canEditCompanyRelationships: async (_, __, { user }) =>
      isEditor(user) || isAccountManager(user),
    canViewEmissionAllocations: async (_, __, { user }) => isViewer(user),
    canEditEmissionAllocations: async (_, __, { user }) => isEditor(user),
    canEditCompanySectors: async (_, __, { user }) => isEditor(user),
    canInviteNewCompanyMembers: async (_, __, { user }) =>
      isEditor(user) || isAccountManager(user),
    canEditCompanyMembers: async (_, __, { user }) =>
      isEditor(user) || isAccountManager(user),
    canRemoveCompanyMembers: async (_, __, { user }) =>
      isEditor(user) || isAccountManager(user),
    canSubmitDataPrivacyInfo: async (_, __, { user }) => isEditor(user),
    preferences: async (roots, args, context) =>
      context.controllers.preferences.findByUserId(undefined, context),
  },
};
