import {
  OrderBy,
  CreateUserInput,
  EditUserInput,
  CreateCompanyUserInput,
  EditCompanyUserInput,
  Role,
  DeleteUserInput,
  ResendUserInviteToJoinEmailInput,
  RoleName,
  ResentAkamaiInviteInput,
  User,
  Company,
} from '../types';
import { ResolverFunction } from './types';

type UserResolverType = {
  Query: {
    users: ResolverFunction<
      { orderBy: OrderBy; sortBy: string; offset: number; limit: number },
      { data: User[]; count: number }
    >;
    user: ResolverFunction<{ email: string }, User | undefined>;
    companyUsers: ResolverFunction<
      { roleNames?: RoleName[] },
      User[] | undefined
    >;
  };
  Mutation: {
    createUser: ResolverFunction<{ input: CreateUserInput }, User>;
    createCompanyUser: ResolverFunction<
      { input: CreateCompanyUserInput },
      User
    >;
    editCompanyUser: ResolverFunction<{ input: EditCompanyUserInput }, User>;
    editUser: ResolverFunction<{ input: EditUserInput }, User>;
    deleteUser: ResolverFunction<{ input: DeleteUserInput }, string>;
    resendUserInviteToJoinEmail: ResolverFunction<
      { input: ResendUserInviteToJoinEmailInput },
      string
    >;
    activateUserAndCompany: ResolverFunction<undefined, User>;
    resendAkamaiInvite: ResolverFunction<
      { input: ResentAkamaiInviteInput },
      string
    >;
  };
  User: {
    roles: ResolverFunction<undefined, Role[]>;
    company: ResolverFunction<undefined, Company | undefined>;
  };
};

export const userResolvers: UserResolverType = {
  Query: {
    async users(_, args, context) {
      const [data, count] = await context.controllers.user.findAll(
        { ...args },
        context
      );

      return {
        data,
        count,
      };
    },
    async user(_, args, context) {
      return context.controllers.user.findByEmail({ ...args }, context);
    },
    async companyUsers(_, args, context) {
      if (!context.user.companyId) {
        return undefined;
      }
      return context.controllers.user.findAllByCompanyId(
        {
          companyId: context.user.companyId,
          roleNames: args.roleNames,
        },
        context
      );
    },
  },
  Mutation: {
    async createUser(_, args, context) {
      return context.controllers.user.createUserByAdmin(
        { ...args.input },
        context
      );
    },
    async createCompanyUser(_, { input }, context) {
      return context.controllers.user.createUserByCompanyMember(input, context);
    },
    async editCompanyUser(_, args, context) {
      return context.controllers.user.editUserByCompanyMember(
        args.input,
        context
      );
    },
    async editUser(_, args, context) {
      return context.controllers.user.editUser({ ...args.input }, context);
    },
    async deleteUser(_, args, context) {
      return context.controllers.user.deleteUser({ ...args.input }, context);
    },
    async resendUserInviteToJoinEmail(_, args, context) {
      return context.controllers.user.resendInviteToJoinEmail(
        { ...args.input },
        context
      );
    },
    async activateUserAndCompany(_, args, context) {
      return context.controllers.user.activateTransaction(undefined, context);
    },
    async resendAkamaiInvite(_, args, context) {
      return context.controllers.user.resendAkamaiInvite(
        { ...args.input },
        context
      );
    },
  },
  User: {
    async roles({ id: userId }, _, { loaders }) {
      return loaders.userRoles.load(userId);
    },
    async company({ companyId }, _, { loaders }) {
      if (companyId) {
        return loaders.company.load(companyId);
      }
      return undefined;
    },
  },
};
