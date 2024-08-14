import { ApolloError } from 'apollo-server-express';
import { Repository } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';
import { adminsMustUseExampleEmailError } from '../../access/exceptions';
import { IContext } from '../../apolloContext';
import { getLDTestData } from '../../clients/LaunchDarklyClient';
import { getInviteLink } from '../../clients/NotificationClient/utils';
import { LaunchDarklyFlags } from '../../config';
import {
  USER_CREATED_ACTION,
  USER_DELETED_ACTION,
  USER_EDITED_ACTION,
} from '../../constants/audit';
import { CompanyEntity } from '../../entities/Company';
import { PreferencesEntity } from '../../entities/Preferences';
import { UserEntity } from '../../entities/User';
import { company2Mock, companyMock } from '../../mocks/company';
import { preferencesMock } from '../../mocks/preferences';
import {
  adminRoleMock,
  createRoleMock,
  supplierEditorRoleMock,
  supplierViewerRoleMock,
} from '../../mocks/role';
import {
  adminUserMock,
  getCurrentUser,
  supplierEditorUser2Mock,
  supplierEditorUserMock,
} from '../../mocks/user';
import { RoleRepository } from '../../repositories/RoleRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { UserService } from '../../services/UserService';
import {
  AuthProvider,
  CompanyStatus,
  ExpertiseDomain,
  OrderBy,
  RoleName,
  UserStatus,
} from '../../types';
import {
  AkamaiRegistrationError,
  AkamaiUserAlreadyExistsError,
} from '../../utils/errors';
import {
  DELETE_USER_NOT_PART_OF_COMPANY_ERROR,
  INVITE_SENT_SUCCESS,
  NOTHING_TO_UPDATE_ERROR,
  NO_COMPANY_ERROR,
  RECIPIENT_COMPANY_CREATED_ERROR,
  RECIPIENT_NOT_EXIST_ERROR,
  RESEND_INVITE_USER_NOT_PART_OF_COMPANY_ERROR,
  SENDER_NOT_EXIST_ERROR,
  ABCD_EMAIL_ERROR,
  UserController,
  USERS_DOES_NOT_EXIST_ERROR,
  USERS_EXISTS_ERROR,
  USER_COMPANY_CONFIRMED_ERROR,
  WRONG_AUTH_PROVIDER_ERROR,
} from './';

jest.mock('../../clients/NotificationClient/utils');
type UserControllerParams = ConstructorParameters<typeof UserController>;
type UserControllerMockParams = {
  userRepository: UserControllerParams[0];
  roleRepository?: UserControllerParams[1];
  companyRepository?: UserControllerParams[2];
  preferenceRepository?: UserControllerParams[3];
  userService?: UserControllerParams[4];
};
describe('UserController', () => {
  const editorRoleSet = [
    createRoleMock({ name: RoleName.SupplierEditor, id: uuidV4() }),
    createRoleMock({ name: RoleName.SupplierViewer, id: uuidV4() }),
  ];

  const adminRoleSet = [
    ...editorRoleSet,
    createRoleMock({ name: RoleName.Admin, id: uuidV4() }),
  ];

  const getUserControllerMock = ({
    userRepository,
    roleRepository = (jest.fn() as unknown) as UserControllerParams[1],
    companyRepository = (jest.fn() as unknown) as UserControllerParams[2],
    preferenceRepository = (jest.fn() as unknown) as UserControllerParams[3],
    userService = (jest.fn() as unknown) as UserControllerParams[4],
  }: UserControllerMockParams) => {
    return new UserController(
      userRepository,
      roleRepository,
      companyRepository,
      preferenceRepository,
      userService
    );
  };

  describe('findByEmail()', () => {
    it('should return user', async () => {
      const findOne = jest.fn();
      const userRepositoryMock = ({
        findOne,
      } as unknown) as UserRepository;
      findOne.mockImplementation(() => adminUserMock);
      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const result = await controller.findByEmail(
        { email: adminUserMock.email },
        (jest.fn() as unknown) as IContext
      );

      expect(findOne).toHaveBeenCalledWith({
        where: { email: adminUserMock.email, isDeleted: false },
      });
      expect(result).toEqual(adminUserMock);
    });
  });

  describe('findById()', () => {
    it('should return user', async () => {
      const findOne = jest.fn();
      const userRepositoryMock = ({
        findOne,
      } as unknown) as UserRepository;
      findOne.mockImplementation(() => adminUserMock);
      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const result = await controller.findById(
        { id: adminUserMock.id },
        (jest.fn() as unknown) as IContext
      );

      expect(findOne).toHaveBeenCalledWith({
        where: { id: adminUserMock.id, isDeleted: false },
      });
      expect(result).toEqual(adminUserMock);
    });
  });

  describe('findAll()', () => {
    it('should return a list of users', async () => {
      const sortBy = 'email';
      const orderBy = OrderBy.Asc;

      const users = [adminUserMock];
      const addOrderBy = jest.fn();
      const where = jest.fn();
      const offset = jest.fn(() => userRepositoryMock);
      const limit = jest.fn(() => userRepositoryMock);
      const getManyAndCount = jest.fn();
      const userRepositoryMock = ({
        createQueryBuilder: () => userRepositoryMock,
        addOrderBy,
        getManyAndCount,
        where,
        offset,
        limit,
      } as unknown) as UserRepository;
      where.mockImplementation(() => userRepositoryMock);
      addOrderBy.mockImplementation(() => userRepositoryMock);
      getManyAndCount.mockImplementation(() => [users, 1]);

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const result = await controller.findAll(
        { sortBy, orderBy, offset: 0, limit: 1000 },
        (jest.fn() as unknown) as IContext
      );

      expect(addOrderBy).toHaveBeenCalledWith(sortBy, orderBy);
      expect(where).toHaveBeenCalledWith({ isDeleted: false });
      expect(offset).toHaveBeenCalledWith(0);
      expect(limit).toHaveBeenCalledWith(1000);
      expect(result).toEqual([[adminUserMock], 1]);
    });
  });

  describe('findByCompanyId()', () => {
    it('should return a list of users in a company', async () => {
      const companyId = supplierEditorUserMock.companyId;

      const users = [supplierEditorUserMock];
      const companyUsers = jest.fn();

      const userRepositoryMock = ({
        companyUsers,
      } as unknown) as UserRepository;
      companyUsers.mockImplementation(() => users);

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const result = await controller.findAllByCompanyId(
        { companyId },
        (jest.fn() as unknown) as IContext
      );

      expect(companyUsers).toHaveBeenCalledWith([companyId], undefined);

      expect(result).toEqual(users);
    });

    it('should return a list of users with a role in a company', async () => {
      const companyId = supplierEditorUserMock.companyId;
      const supplierRoleId = 'supplier_role_id';
      const users = [supplierEditorUserMock];

      const companyUsers = jest.fn();
      companyUsers.mockImplementation(() => users);
      const userRepositoryMock = ({
        companyUsers,
      } as unknown) as UserRepository;
      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const findRoles = jest.fn();
      findRoles.mockImplementation(() => [{ id: supplierRoleId }]);
      const mockContext = {
        controllers: {
          role: {
            findAll: findRoles,
          },
        },
      };

      const result = await controller.findAllByCompanyId(
        { companyId, roleNames: [RoleName.SupplierEditor] },
        (mockContext as unknown) as IContext
      );

      expect(companyUsers).toHaveBeenCalledWith(
        [companyId],
        [RoleName.SupplierEditor]
      );

      expect(result).toEqual(users);
    });
  });

  describe('createUser()', () => {
    it('should return an error if the user already exists', async () => {
      const {
        email,
        firstName,
        lastName,
        authProvider,
        companyId,
      } = adminUserMock;
      const userRepositoryMock = ({
        findOne: () => adminUserMock,
      } as unknown) as UserRepository;

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      try {
        await controller.createUserByAdmin(
          {
            email,
            firstName,
            lastName,
            authProvider,
            roleName: RoleName.Admin,
            companyId,
          },
          { user: { roles: adminRoleSet } } as IContext
        );
      } catch (err) {
        expect(err.message).toBe(USERS_EXISTS_ERROR);
      }
    });

    describe('creating internal user', () => {
      const {
        email,
        firstName,
        lastName,
        authProvider,
        companyId,
      } = adminUserMock;

      it('should create and return an Admin user', async () => {
        const currentUser = {
          id: 'currentUserId',
          roles: adminRoleSet,
        };

        const userRepositoryMock = ({
          findOne: () => undefined,
          save: () => ({ ...adminUserMock }),
        } as unknown) as UserRepository;

        const roleRepositoryMock = ({
          findOne: () => adminRoleMock,
          findNewRoleSet: () => [
            adminRoleMock,
            supplierEditorRoleMock,
            supplierViewerRoleMock,
          ],
        } as unknown) as RoleRepository;

        const saveAuditTrail = jest.fn();
        const contextMock = ({
          user: currentUser,
          controllers: {
            audit: { saveAuditTrail },
          },
        } as unknown) as IContext;

        const userService: Partial<UserService> = {
          create: () => {
            const user: Partial<UserEntity> = {
              ...adminUserMock,
              roles: undefined,
              save: jest.fn(),
              createdAt: (adminUserMock.createdAt as unknown) as Date,
              updatedAt: (adminUserMock.updatedAt as unknown) as Date,
            };
            return user as Promise<UserEntity>;
          },
        };

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
          userService: userService as UserService,
        });

        const result = await controller.createUserByAdmin(
          {
            email,
            firstName,
            lastName,
            authProvider,
            roleName: RoleName.Admin,
            companyId,
          },
          contextMock
        );

        expect(saveAuditTrail).toHaveBeenCalledWith(
          {
            userId: currentUser.id,
            action: USER_CREATED_ACTION,
            currentPayload: JSON.stringify({
              id: adminUserMock.id,
              authProvider,
              roles: [
                adminRoleMock,
                supplierEditorRoleMock,
                supplierViewerRoleMock,
              ],
            }),
          },
          expect.any(Object)
        );
        expect(result).toEqual(
          expect.objectContaining({
            ...adminUserMock,
            roles: [
              adminRoleMock,
              supplierEditorRoleMock,
              supplierViewerRoleMock,
            ],
          })
        );
      });

      it('should throw an error when a non-example email is provided', async () => {
        const currentUser = {
          id: 'currentUserId',
          roles: adminRoleSet,
        };

        const userRepositoryMock = ({
          findOne: () => undefined,
        } as unknown) as UserRepository;

        const roleRepositoryMock = ({
          findOne: () => adminRoleMock,
        } as unknown) as RoleRepository;

        const contextMock = ({
          user: currentUser,
        } as unknown) as IContext;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
        });

        try {
          await controller.createUserByAdmin(
            {
              email: 'invalid@email.com',
              firstName,
              lastName,
              authProvider,
              roleName: RoleName.Admin,
              companyId: companyMock.id,
            },
            contextMock
          );
        } catch (err) {
          expect(err.message).toBe(adminsMustUseExampleEmailError().message);
        }
      });
    });

    describe('creating an external user when a supplier editor invites his company member', () => {
      const currentUser = {
        id: 'currentUserId',
        roles: adminRoleSet,
      };

      const {
        email,
        firstName,
        lastName,
        authProvider,
      } = supplierEditorUserMock;

      const setupContext = ({
        saveAuditTrailMock,
        akamaiRegisterMock,
        notifyNewAkamaiUserWelcomeMock,
        notifyExistingAkamaiUserWelcomeMock,
      }: {
        saveAuditTrailMock?: jest.Mock;
        akamaiRegisterMock?: jest.Mock;
        notifyNewAkamaiUserWelcomeMock?: jest.Mock;
        notifyExistingAkamaiUserWelcomeMock?: jest.Mock;
      }) =>
        (({
          user: currentUser,
          controllers: {
            audit: { saveAuditTrail: saveAuditTrailMock ?? jest.fn() },
          },
          clients: {
            akamai: {
              register: akamaiRegisterMock ?? jest.fn(),
            },
            notification: {
              notifyNewAkamaiUserWelcome:
                notifyNewAkamaiUserWelcomeMock ?? jest.fn(),
              notifyExistingAkamaiUserWelcome:
                notifyExistingAkamaiUserWelcomeMock ?? jest.fn(),
            },
          },
        } as unknown) as IContext);

      const userRepositoryMock = ({
        findOne: () => undefined,
        save: () => ({
          ...supplierEditorUserMock,
          company: companyMock,
          preferences: preferencesMock,
        }),
      } as unknown) as UserRepository;

      const roleRepositoryMock = ({
        findOneOrFail: () => supplierEditorRoleMock,
        findNewRoleSet: () => [supplierEditorRoleMock],
      } as unknown) as RoleRepository;

      const companyRepositoryMock = ({
        findOne: () => companyMock,
      } as unknown) as Repository<CompanyEntity>;

      const savePreference = jest.fn();
      const preferencesRepositoryMock = ({
        findOne: () => preferencesMock,
        save: savePreference,
      } as unknown) as Repository<PreferencesEntity>;

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should create and return a user', async () => {
        const saveAuditTrailMock = jest.fn();
        const akamaiRegisterMock = jest.fn();
        const notifyNewAkamaiUserWelcomeMock = jest.fn();

        const contextMock = setupContext({
          saveAuditTrailMock,
          akamaiRegisterMock,
          notifyNewAkamaiUserWelcomeMock,
        });

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
          companyRepository: companyRepositoryMock,
          preferenceRepository: preferencesRepositoryMock,
        });

        const result = await controller.createUserByCompanyMember(
          {
            email,
            firstName,
            lastName,
            authProvider,
            roleName: RoleName.SupplierEditor,
            companyId: companyMock.id,
          },
          contextMock
        );

        expect(result).toEqual({
          ...supplierEditorUserMock,
          preferences: preferencesMock,
          company: companyMock,
        });

        expect(akamaiRegisterMock).toHaveBeenCalledWith({
          email,
          firstName,
          lastName,
        });

        expect(savePreference).toHaveBeenCalledWith({
          userId: supplierEditorUserMock.id,
        });
      });
    });

    describe('creating an external user', () => {
      const currentUser = {
        id: 'currentUserId',
        roles: adminRoleSet,
      };

      const {
        email,
        firstName,
        lastName,
        authProvider,
      } = supplierEditorUserMock;

      const setupContext = ({
        saveAuditTrailMock,
        akamaiRegisterMock,
        notifyNewAkamaiUserWelcomeMock,
        notifyExistingAkamaiUserWelcomeMock,
      }: {
        saveAuditTrailMock?: jest.Mock;
        akamaiRegisterMock?: jest.Mock;
        notifyNewAkamaiUserWelcomeMock?: jest.Mock;
        notifyExistingAkamaiUserWelcomeMock?: jest.Mock;
      }) =>
        (({
          user: currentUser,
          controllers: {
            audit: { saveAuditTrail: saveAuditTrailMock ?? jest.fn() },
          },
          clients: {
            akamai: {
              register: akamaiRegisterMock ?? jest.fn(),
            },
            notification: {
              notifyNewAkamaiUserWelcome:
                notifyNewAkamaiUserWelcomeMock ?? jest.fn(),
              notifyExistingAkamaiUserWelcome:
                notifyExistingAkamaiUserWelcomeMock ?? jest.fn(),
            },
          },
        } as unknown) as IContext);

      const userRepositoryMock = ({
        findOne: () => undefined,
        save: () => ({
          ...supplierEditorUserMock,
          company: companyMock,
          preferences: preferencesMock,
        }),
      } as unknown) as UserRepository;

      const roleRepositoryMock = ({
        findOne: () => supplierEditorRoleMock,
        findRolesByName: () => [
          adminRoleMock,
          supplierEditorRoleMock,
          supplierViewerRoleMock,
        ],
        findNewRoleSet: () => [],
      } as unknown) as RoleRepository;

      const companyRepositoryMock = ({
        findOne: () => companyMock,
      } as unknown) as Repository<CompanyEntity>;

      const savePreference = jest.fn();
      const preferencesRepositoryMock = ({
        findOne: () => preferencesMock,
        save: savePreference,
      } as unknown) as Repository<PreferencesEntity>;

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should create and return a user', async () => {
        const saveAuditTrailMock = jest.fn();
        const akamaiRegisterMock = jest.fn();
        const notifyNewAkamaiUserWelcomeMock = jest.fn();

        const contextMock = setupContext({
          saveAuditTrailMock,
          akamaiRegisterMock,
          notifyNewAkamaiUserWelcomeMock,
        });

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
          companyRepository: companyRepositoryMock,
          preferenceRepository: preferencesRepositoryMock,
        });
        const result = await controller.createUserByAdmin(
          {
            email,
            firstName,
            lastName,
            authProvider,
            roleName: RoleName.SupplierEditor,
            companyId: companyMock.id,
          },
          contextMock
        );

        expect(saveAuditTrailMock).toHaveBeenCalledWith(
          {
            userId: currentUser.id,
            action: USER_CREATED_ACTION,
            currentPayload: JSON.stringify({
              id: supplierEditorUserMock.id,
              authProvider,
              company: companyMock,
            }),
          },
          expect.any(Object)
        );
        expect(result).toEqual({
          ...supplierEditorUserMock,
          preferences: preferencesMock,
          company: companyMock,
        });

        expect(akamaiRegisterMock).toHaveBeenCalledWith({
          email,
          firstName,
          lastName,
        });

        expect(savePreference).toHaveBeenCalledWith({
          userId: supplierEditorUserMock.id,
        });
      });

      describe('when the user is new to Akamai', () => {
        it('should call notifyNewAkamaiUserWelcome()', async () => {
          const notifyNewAkamaiUserWelcomeMock = jest.fn();

          const contextMock = setupContext({
            notifyNewAkamaiUserWelcomeMock,
          });

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
            roleRepository: roleRepositoryMock,
            companyRepository: companyRepositoryMock,
            preferenceRepository: preferencesRepositoryMock,
          });

          await controller.createUserByAdmin(
            {
              email,
              firstName,
              lastName,
              authProvider,
              roleName: RoleName.SupplierEditor,
              companyId: companyMock.id,
            },
            contextMock
          );

          expect(notifyNewAkamaiUserWelcomeMock).toHaveBeenCalledWith(
            expect.objectContaining({
              recipient: expect.objectContaining({
                email,
              }),
            })
          );
        });
      });

      describe('when the user already exists in Akamai', () => {
        it('should call notifyExistingAkamaiUserWelcome()', async () => {
          const notifyExistingAkamaiUserWelcomeMock = jest.fn();
          const akamaiRegisterMock = jest.fn();

          akamaiRegisterMock.mockRejectedValueOnce(
            new AkamaiUserAlreadyExistsError('requestId')
          );

          const contextMock = setupContext({
            notifyExistingAkamaiUserWelcomeMock,
            akamaiRegisterMock,
          });

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
            roleRepository: roleRepositoryMock,
            companyRepository: companyRepositoryMock,
            preferenceRepository: preferencesRepositoryMock,
          });

          await controller.createUserByAdmin(
            {
              email,
              firstName,
              lastName,
              authProvider,
              roleName: RoleName.SupplierEditor,
              companyId: companyMock.id,
            },
            contextMock
          );

          expect(notifyExistingAkamaiUserWelcomeMock).toHaveBeenCalledWith(
            expect.objectContaining({
              recipient: expect.objectContaining({
                email,
              }),
            })
          );
        });
      });

      describe('when Akamai API throws an error not related to existing users', () => {
        it('should not trigger a welcome email to the user', async () => {
          const notifyNewAkamaiUserWelcomeMock = jest.fn();
          const notifyExistingAkamaiUserWelcomeMock = jest.fn();
          const akamaiRegisterMock = jest.fn();

          akamaiRegisterMock.mockRejectedValueOnce(
            new AkamaiRegistrationError('unknown error')
          );

          const contextMock = setupContext({
            notifyNewAkamaiUserWelcomeMock,
            notifyExistingAkamaiUserWelcomeMock,
            akamaiRegisterMock,
          });

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
            roleRepository: roleRepositoryMock,
            companyRepository: companyRepositoryMock,
            preferenceRepository: preferencesRepositoryMock,
          });

          expect.assertions(2);

          try {
            await controller.createUserByAdmin(
              {
                email,
                firstName,
                lastName,
                authProvider,
                roleName: RoleName.SupplierEditor,
                companyId: companyMock.id,
              },
              contextMock
            );
          } catch (err) {
            expect(notifyExistingAkamaiUserWelcomeMock).not.toHaveBeenCalled();
            expect(notifyNewAkamaiUserWelcomeMock).not.toHaveBeenCalled();
          }
        });
      });

      it('should return an error when Admin role is being assigned to a non-Example email', async () => {
        const mockContext = { user: { roles: adminRoleSet } };

        const userRepositoryMock = ({
          findOne: () => undefined,
        } as unknown) as UserRepository;

        const roleRepositoryMock = ({
          findNewRoleSet: () => [
            adminRoleMock,
            supplierEditorRoleMock,
            supplierViewerRoleMock,
          ],
        } as unknown) as RoleRepository;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
          companyRepository: companyRepositoryMock,
        });

        try {
          await controller.createUserByAdmin(
            {
              email: 'test@invalid.com',
              firstName,
              lastName,
              authProvider: AuthProvider.Akamai,
              roleName: RoleName.Admin,
              companyId: companyMock.id,
            },
            mockContext as IContext
          );
        } catch (err) {
          expect(err.message).toBe(adminsMustUseExampleEmailError().message);
        }
      });

      it('should throw an error if example email address is provided with AKAMAI authProvider', async () => {
        const userRepositoryMock = ({
          findOne: () => undefined,
        } as unknown) as UserRepository;

        const roleRepositoryMock = ({
          findOne: () => supplierEditorRoleMock,
        } as unknown) as RoleRepository;

        const mockContext = { user: { roles: editorRoleSet } };

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
          companyRepository: companyRepositoryMock,
        });

        try {
          await controller.createUserByAdmin(
            {
              email: 'test@example.com',
              firstName,
              lastName,
              authProvider: AuthProvider.Akamai,
              roleName: RoleName.SupplierEditor,
              companyId: companyMock.id,
            },
            mockContext as IContext
          );
        } catch (err) {
          expect(err.message).toBe(ABCD_EMAIL_ERROR);
        }
      });

      it('should throw an error when company cannot be found', async () => {
        const userRepositoryMock = ({
          findOne: () => undefined,
          save: () => ({
            ...supplierEditorUserMock,
            roles: [supplierEditorRoleMock, supplierViewerRoleMock],
            company: companyMock,
          }),
        } as unknown) as UserRepository;

        const roleRepositoryMock = ({
          findOne: () => supplierEditorRoleMock,
        } as unknown) as RoleRepository;

        const companyRepositoryMock = ({
          findOne: () => undefined,
        } as unknown) as Repository<CompanyEntity>;

        const preferencesRepositoryMock = ({
          findOne: () => undefined,
        } as unknown) as Repository<PreferencesEntity>;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
          companyRepository: companyRepositoryMock,
          preferenceRepository: preferencesRepositoryMock,
        });

        const mockContext = { user: { roles: adminRoleSet } };

        try {
          await controller.createUserByAdmin(
            {
              email,
              firstName,
              lastName,
              authProvider: AuthProvider.Akamai,
              roleName: RoleName.SupplierEditor,
              companyId: companyMock.id,
            },
            mockContext as IContext
          );
        } catch (err) {
          expect(err.message).toBe(NO_COMPANY_ERROR);
        }
      });
    });
  });

  describe('editUser', () => {
    const firstName = 'Hello';
    const lastName = 'World';
    const updatedUser = {
      ...supplierEditorUserMock,
      company: company2Mock,
      firstName,
      lastName,
    };

    it('should edit and return edited user', async () => {
      const currentUser = {
        id: 'currentUserId',
        roles: adminRoleSet,
      };

      const saveAuditTrail = jest.fn();
      const contextMock = ({
        user: currentUser,
        controllers: {
          audit: { saveAuditTrail },
        },
      } as unknown) as IContext;

      const userRepositoryMock = ({
        findOne: () => ({
          ...supplierEditorUserMock,
          roles: [supplierEditorRoleMock, supplierViewerRoleMock],
          company: companyMock,
        }),
        save: () => updatedUser,
      } as unknown) as UserRepository;
      const roleRepositoryMock = ({
        findOne: () => supplierViewerRoleMock,
        findNewRoleSet: () => [supplierViewerRoleMock],
      } as unknown) as RoleRepository;
      const companyRepositoryMock = ({
        findOne: () => company2Mock,
      } as unknown) as Repository<CompanyEntity>;
      const preferencesRepositoryMock = ({
        findOne: () => company2Mock,
      } as unknown) as Repository<PreferencesEntity>;

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
        roleRepository: roleRepositoryMock,
        companyRepository: companyRepositoryMock,
        preferenceRepository: preferencesRepositoryMock,
      });

      const result = await controller.editUser(
        {
          firstName,
          lastName,
          email: supplierEditorUserMock.email,
          roleName: RoleName.SupplierViewer,
          companyId: company2Mock.id,
        },
        contextMock
      );

      expect(saveAuditTrail).toHaveBeenCalledWith(
        {
          userId: currentUser.id,
          action: USER_EDITED_ACTION,
          previousPayload: JSON.stringify({
            id: supplierEditorUserMock.id,
            authProvider: supplierEditorUserMock.authProvider,
            company: companyMock,
          }),
          currentPayload: JSON.stringify({
            id: updatedUser.id,
            authProvider: updatedUser.authProvider,
            company: company2Mock,
          }),
        },
        expect.any(Object)
      );

      expect(result).toEqual(updatedUser);
    });

    it('should return an error if the user does not exist', async () => {
      const userRepositoryMock = ({
        findOne: () => undefined,
      } as unknown) as UserRepository;

      const mockContext = { user: { roles: adminRoleSet } };

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      try {
        await controller.editUser(
          {
            firstName,
            lastName,
            email: adminUserMock.email,
            roleName: RoleName.Admin,
          },
          mockContext as IContext
        );
      } catch (err) {
        expect(err.message).toBe(USERS_DOES_NOT_EXIST_ERROR);
      }
    });
  });

  describe('editUserByCompanyMember', () => {
    const firstName = 'Hello';
    const lastName = 'World';
    const updatedUser = {
      ...supplierEditorUserMock,
      company: company2Mock,
      firstName,
      lastName,
    };

    it('should edit and return edited user', async () => {
      const currentUser = {
        id: 'currentUserId',
        roles: adminRoleSet,
      };

      const saveAuditTrail = jest.fn();
      const contextMock = ({
        user: currentUser,
        controllers: {
          audit: { saveAuditTrail },
        },
      } as unknown) as IContext;

      const userRepositoryMock = ({
        findOne: () => ({
          ...supplierEditorUserMock,
          roles: [supplierEditorRoleMock, supplierViewerRoleMock],
          company: companyMock,
        }),
        save: () => updatedUser,
      } as unknown) as UserRepository;
      const roleRepositoryMock = ({
        findNewRoleSet: () => [supplierEditorRoleMock, supplierViewerRoleMock],
        findOne: () => supplierViewerRoleMock,
      } as unknown) as RoleRepository;
      const companyRepositoryMock = ({
        findOne: () => company2Mock,
      } as unknown) as Repository<CompanyEntity>;
      const preferencesRepositoryMock = ({
        findOne: () => company2Mock,
      } as unknown) as Repository<PreferencesEntity>;

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
        roleRepository: roleRepositoryMock,
        companyRepository: companyRepositoryMock,
        preferenceRepository: preferencesRepositoryMock,
      });

      const result = await controller.editUserByCompanyMember(
        {
          firstName,
          lastName,
          email: supplierEditorUserMock.email,
          roleName: RoleName.SupplierEditor,
        },
        contextMock
      );

      expect(saveAuditTrail).toHaveBeenCalledWith(
        {
          userId: currentUser.id,
          action: USER_EDITED_ACTION,
          previousPayload: JSON.stringify({
            id: supplierEditorUserMock.id,
            authProvider: supplierEditorUserMock.authProvider,
            roles: [supplierEditorRoleMock, supplierViewerRoleMock],
          }),
          currentPayload: JSON.stringify({
            id: updatedUser.id,
            authProvider: updatedUser.authProvider,
            roles: [supplierEditorRoleMock, supplierViewerRoleMock],
          }),
        },
        contextMock
      );

      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser()', () => {
    describe.each`
      role                       | companyId
      ${RoleName.Admin}          | ${undefined}
      ${RoleName.SupplierEditor} | ${supplierEditorUserMock.companyId}
    `(
      'when user is $role',
      ({ role, companyId }: { role: RoleName; companyId?: string }) => {
        const currentUser = {
          id: 'currentUserId',
          roles: [
            {
              name: role,
            },
          ],
          companyId,
        };

        it('should remove personal user details and hash email', async () => {
          const saveAuditTrail = jest.fn();
          const contextMock = ({
            user: currentUser,
            controllers: {
              audit: { saveAuditTrail },
            },
            clients: {
              notification: {
                notifyUserRemovedFromCompany: jest.fn(),
              },
            },
          } as unknown) as IContext;

          const softDeleteUsers = jest.fn();
          const userRepositoryMock = ({
            findOne: () => ({ ...supplierEditorUserMock }),
            softDeleteUsers,
          } as unknown) as UserRepository;
          softDeleteUsers.mockImplementation(() => [supplierEditorUserMock]);
          const roleRepositoryMock = (jest.fn() as unknown) as RoleRepository;
          const companyRepositoryMock = (jest.fn() as unknown) as Repository<CompanyEntity>;
          const preferencesRepositoryMock = (jest.fn() as unknown) as Repository<PreferencesEntity>;

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
            roleRepository: roleRepositoryMock,
            companyRepository: companyRepositoryMock,
            preferenceRepository: preferencesRepositoryMock,
          });

          const result = await controller.deleteUser(
            { id: supplierEditorUserMock.id },
            contextMock
          );

          const [[saveCall]] = softDeleteUsers.mock.calls;
          const [[saveAuditCall]] = saveAuditTrail.mock.calls;

          expect(result).toBe(supplierEditorUserMock.id);
          expect(saveCall).toEqual([supplierEditorUserMock]);

          expect(saveAuditCall).toMatchSnapshot();
        });

        it('should throw an error if user does not exist', async () => {
          const contextMock = ({} as unknown) as IContext;

          const userRepositoryMock = ({
            findOne: () => undefined,
          } as unknown) as UserRepository;

          const roleRepositoryMock = (jest.fn() as unknown) as RoleRepository;
          const companyRepositoryMock = (jest.fn() as unknown) as Repository<CompanyEntity>;
          const preferencesRepositoryMock = (jest.fn() as unknown) as Repository<PreferencesEntity>;

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
            roleRepository: roleRepositoryMock,
            companyRepository: companyRepositoryMock,
            preferenceRepository: preferencesRepositoryMock,
          });

          try {
            await controller.deleteUser(
              { id: supplierEditorUserMock.id },
              contextMock
            );
          } catch (err) {
            expect(err.message).toBe(USERS_DOES_NOT_EXIST_ERROR);
          }
        });

        describe.each`
          authProvider           | shouldSendNotification
          ${AuthProvider.Akamai} | ${true}
          ${AuthProvider.Invite} | ${false}
          ${AuthProvider.Port}   | ${false}
        `(
          'when the user authenticates via $authProvider',
          ({
            authProvider,
            shouldSendNotification,
          }: {
            authProvider: AuthProvider;
            shouldSendNotification: boolean;
          }) => {
            it('should (NOT) send user to be removed from Akamai notification', async () => {
              const notifyUserRemovedFromCompany = jest.fn();
              const contextMock = ({
                user: currentUser,
                controllers: {
                  audit: { saveAuditTrail: jest.fn() },
                },
                clients: {
                  notification: {
                    notifyUserRemovedFromCompany,
                  },
                },
              } as unknown) as IContext;

              const userToBeRemoved = {
                ...supplierEditorUserMock,
                authProvider,
              };

              const userRepositoryMock = ({
                findOne: () => ({ ...userToBeRemoved }),
                softDeleteUsers: jest.fn(() => [userToBeRemoved]),
              } as unknown) as UserRepository;

              const roleRepositoryMock = (jest.fn() as unknown) as RoleRepository;
              const companyRepositoryMock = (jest.fn() as unknown) as Repository<CompanyEntity>;
              const preferencesRepositoryMock = (jest.fn() as unknown) as Repository<PreferencesEntity>;

              const controller = getUserControllerMock({
                userRepository: userRepositoryMock,
                roleRepository: roleRepositoryMock,
                companyRepository: companyRepositoryMock,
                preferenceRepository: preferencesRepositoryMock,
              });

              await controller.deleteUser(
                { id: userToBeRemoved.id },
                contextMock
              );

              if (shouldSendNotification) {
                expect(notifyUserRemovedFromCompany).toHaveBeenCalled();
              } else {
                expect(notifyUserRemovedFromCompany).not.toHaveBeenCalled();
              }
            });
          }
        );
      }
    );

    describe('when authenticated user is an external user who does not belong to the company of the user being deleted', () => {
      it('should throw an error', async () => {
        const randomCompanyId = '';
        const currentUser = {
          id: 'currentUserId',
          roles: [
            {
              name: RoleName.SupplierEditor,
            },
          ],
          companyId: randomCompanyId,
        };

        const contextMock = ({
          user: currentUser,
        } as unknown) as IContext;

        const userRepositoryMock = ({
          findOne: () => ({ ...supplierEditorUserMock }),
        } as unknown) as UserRepository;

        const roleRepositoryMock = (jest.fn() as unknown) as RoleRepository;
        const companyRepositoryMock = (jest.fn() as unknown) as Repository<CompanyEntity>;
        const preferencesRepositoryMock = (jest.fn() as unknown) as Repository<PreferencesEntity>;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
          roleRepository: roleRepositoryMock,
          companyRepository: companyRepositoryMock,
          preferenceRepository: preferencesRepositoryMock,
        });
        expect.assertions(1);

        try {
          await controller.deleteUser(
            { id: supplierEditorUserMock.id },
            contextMock
          );
        } catch (err) {
          expect(err.message).toBe(DELETE_USER_NOT_PART_OF_COMPANY_ERROR);
        }
      });
    });
  });

  describe('createUserByCompanyInvitation()', () => {
    const setupCreatePendingUser = async ({
      saveMock,
      saveAuditTrailMock,
      findUserOverride,
      savePreferencesMock,
    }: {
      saveMock?: jest.Mock;
      saveAuditTrailMock?: jest.Mock;
      savePreferencesMock?: jest.Mock;
      findUserOverride?: unknown;
    }) => {
      const saveAuditTrail = saveAuditTrailMock ?? jest.fn();

      const findRoleByName = jest.fn();
      findRoleByName.mockImplementation(() => supplierEditorRoleMock);

      const mockContext = {
        controllers: {
          audit: {
            saveAuditTrail,
          },
          role: {
            findByName: findRoleByName,
          },
        },
        user: supplierEditorUserMock,
      };

      const findOne = jest.fn();
      findOne.mockImplementation(() =>
        typeof findUserOverride !== 'undefined' ? findUserOverride : undefined
      );

      const save = saveMock ?? jest.fn();
      save.mockImplementation(() => supplierEditorUser2Mock);

      const userRepositoryMock = ({
        findOne,
        save,
      } as unknown) as UserRepository;

      const savePreferences = savePreferencesMock ?? jest.fn();
      const preferencesRepositoryMock: Partial<
        Repository<PreferencesEntity>
      > = {
        save: savePreferences,
      };

      const roleRepositoryMock = ({
        findOne: () => supplierEditorRoleMock,
        findNewRoleSet: () => [
          adminRoleMock,
          supplierEditorRoleMock,
          supplierViewerRoleMock,
        ],
      } as unknown) as RoleRepository;

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
        roleRepository: roleRepositoryMock,
        preferenceRepository: preferencesRepositoryMock as Repository<PreferencesEntity>,
      });

      return controller.createUserByCompanyInvitation(
        {
          authProvider: supplierEditorUser2Mock.authProvider,
          firstName: supplierEditorUser2Mock.firstName,
          lastName: supplierEditorUser2Mock.lastName,
          email: supplierEditorUser2Mock.email,
          companyId: supplierEditorUser2Mock.companyId,
          roleName: RoleName.SupplierEditor,
        },
        (mockContext as unknown) as IContext
      );
    };

    describe('when user is successfully created', () => {
      it('should return the new user', async () => {
        const saveMock = jest.fn();

        const result = await setupCreatePendingUser({
          saveMock,
        });

        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(saveMock).toHaveBeenCalledWith(expect.anything(), {
          data: { inviter: supplierEditorUserMock },
        });
        expect(result).toEqual(supplierEditorUser2Mock);
      });

      it('should insert user preferences', async () => {
        const savePreferencesMock = jest.fn();

        await setupCreatePendingUser({
          savePreferencesMock,
        });

        expect(savePreferencesMock).toHaveBeenCalledTimes(1);
      });

      it('should record an audit trail', async () => {
        const saveAuditTrail = jest.fn();

        await setupCreatePendingUser({
          saveAuditTrailMock: saveAuditTrail,
        });

        const [[saveAuditTrailCall]] = saveAuditTrail.mock.calls;
        expect(saveAuditTrailCall).toEqual({
          userId: supplierEditorUserMock.id,
          action: USER_CREATED_ACTION,
          currentPayload: JSON.stringify({
            id: supplierEditorUser2Mock.id,
            authProvider: supplierEditorUser2Mock.authProvider,
            status: supplierEditorUser2Mock.status,
          }),
        });
      });
    });

    describe('when a user with the email already exists', () => {
      it('should throw an error', async () => {
        const findUserOverride = supplierEditorUser2Mock;

        expect.assertions(1);

        try {
          await setupCreatePendingUser({
            findUserOverride,
          });
        } catch (err) {
          expect(err.message).toBe(USERS_EXISTS_ERROR);
        }
      });
    });
  });

  describe('resendInviteToJoinEmail()', () => {
    const currentUser = getCurrentUser({
      userOverrides: adminUserMock,
    });

    const inviter = getCurrentUser({
      userOverrides: { id: supplierEditorUserMock.id },
    });

    describe('on success', () => {
      describe(`when ${LaunchDarklyFlags.IS_HUBSPOT_INVITE_TO_JOIN_WORKFLOW_ENABLED} is off`, () => {
        beforeAll(async () => {
          const td = await getLDTestData();
          await td.update(
            td
              .flag(
                LaunchDarklyFlags.IS_HUBSPOT_INVITE_TO_JOIN_WORKFLOW_ENABLED
              )
              .valueForAllUsers(false)
          );
        });
        afterAll(async () => {
          const td = await getLDTestData();
          await td.update(
            td
              .flag(
                LaunchDarklyFlags.IS_HUBSPOT_INVITE_TO_JOIN_WORKFLOW_ENABLED
              )
              .valueForAllUsers(true)
          );
        });
        it('sends a Mulesoft email notification', async () => {
          const currentUser = getCurrentUser({
            userOverrides: adminUserMock,
          });

          const inviter = getCurrentUser({
            userOverrides: { id: supplierEditorUserMock.id },
          });

          const invitee = getCurrentUser({
            userOverrides: { id: supplierEditorUser2Mock.id },
            companyOverrides: {
              createdBy: inviter.id,
              status: CompanyStatus.PendingUserConfirmation,
            },
          });

          const findUser = jest.fn();
          findUser
            .mockImplementationOnce(() => invitee)
            .mockImplementationOnce(() => inviter);

          const userRepositoryMock = ({
            findOne: findUser,
          } as unknown) as UserRepository;

          const notifyOfInviteToJoin = jest.fn();
          const contextMock = ({
            user: currentUser,
            clients: {
              notification: {
                notifyOfInviteToJoin,
              },
            },
          } as unknown) as IContext;

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
          });

          const result = await controller.resendInviteToJoinEmail(
            { userId: invitee.id },
            contextMock
          );

          expect(result).toEqual(INVITE_SENT_SUCCESS);
          expect(notifyOfInviteToJoin).toHaveBeenCalledTimes(1);
          expect(notifyOfInviteToJoin).toHaveBeenCalledWith({
            recipient: invitee,
            sender: inviter,
          });
        });
      });
      it('should return a success message', async () => {
        const currentUser = getCurrentUser({
          userOverrides: adminUserMock,
        });

        const inviter = getCurrentUser({
          userOverrides: { id: supplierEditorUserMock.id },
        });

        const invitee = getCurrentUser({
          userOverrides: { id: supplierEditorUser2Mock.id },
          companyOverrides: {
            createdBy: inviter.id,
            status: CompanyStatus.PendingUserConfirmation,
          },
        });

        const findUser = jest.fn();
        findUser
          .mockImplementationOnce(() => invitee)
          .mockImplementationOnce(() => inviter);

        const userRepositoryMock = ({
          findOne: findUser,
        } as unknown) as UserRepository;

        const inviteLink = 'https://test.example.com/invite';
        (getInviteLink as jest.Mock).mockReturnValueOnce(inviteLink);

        const resendInviteToJoinEmail = jest.fn().mockResolvedValueOnce({});
        const contextMock = ({
          user: currentUser,
          clients: {
            hubspotEmail: {
              resendInviteToJoinEmail,
            },
          },
        } as unknown) as IContext;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
        });

        const result = await controller.resendInviteToJoinEmail(
          { userId: invitee.id },
          contextMock
        );

        expect(result).toEqual(INVITE_SENT_SUCCESS);
        expect(resendInviteToJoinEmail).toHaveBeenCalledTimes(1);
        expect(resendInviteToJoinEmail).toHaveBeenCalledWith({
          recipient: invitee,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          inviterCompanyName: inviter.company.name,
          invitationLink: inviteLink,
        });
      });
    });

    describe.each`
      inviteeCompanyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.InvitationDeclined}
      ${CompanyStatus.PendingUserActivation}
      ${CompanyStatus.Vetoed}
      ${CompanyStatus.VettingInProgress}
    `(
      'when invitee company has $inviteeCompanyStatus status',
      ({ inviteeCompanyStatus }: { inviteeCompanyStatus: CompanyStatus }) => {
        it('should throw an error', async () => {
          const currentUser = getCurrentUser({
            userOverrides: adminUserMock,
          });

          const invitee = getCurrentUser({
            userOverrides: { id: supplierEditorUser2Mock.id },
            companyOverrides: {
              createdBy: 'RANDOM_ID',
              status: inviteeCompanyStatus,
            },
          });

          const findUser = jest.fn();
          findUser.mockImplementationOnce(() => invitee);

          const userRepositoryMock = ({
            findOne: findUser,
          } as unknown) as UserRepository;

          const notifyOfInviteToJoin = jest.fn();
          const contextMock = ({
            user: currentUser,
            clients: {
              notification: {
                notifyOfInviteToJoin,
              },
            },
          } as unknown) as IContext;

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
          });

          expect.assertions(2);

          try {
            await controller.resendInviteToJoinEmail(
              { userId: invitee.id },
              contextMock
            );
          } catch (err) {
            expect(err.message).toBe(USER_COMPANY_CONFIRMED_ERROR);
            expect(notifyOfInviteToJoin).toHaveBeenCalledTimes(0);
          }
        });
      }
    );

    describe('when invitee cannot be found', () => {
      it('should throw an error', async () => {
        const currentUser = getCurrentUser({
          userOverrides: adminUserMock,
        });

        const invitee = null;

        const findUser = jest.fn();
        findUser.mockImplementationOnce(() => invitee);

        const userRepositoryMock = ({
          findOne: findUser,
        } as unknown) as UserRepository;

        const notifyOfInviteToJoin = jest.fn();
        const contextMock = ({
          user: currentUser,
          clients: {
            notification: {
              notifyOfInviteToJoin,
            },
          },
        } as unknown) as IContext;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
        });
        expect.assertions(2);

        try {
          await controller.resendInviteToJoinEmail(
            { userId: 'INVITEE_ID' },
            contextMock
          );
        } catch (err) {
          expect(err.message).toBe(RECIPIENT_NOT_EXIST_ERROR);
          expect(notifyOfInviteToJoin).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('when invitee company has been created not invited', () => {
      it('should throw an error', async () => {
        const invitee = getCurrentUser({
          userOverrides: { id: supplierEditorUser2Mock.id },
          companyOverrides: {
            status: CompanyStatus.PendingUserConfirmation,
          },
        });

        const findUser = jest.fn();
        findUser.mockImplementationOnce(() => invitee);

        const userRepositoryMock = ({
          findOne: findUser,
        } as unknown) as UserRepository;

        const notifyOfInviteToJoin = jest.fn();
        const contextMock = ({
          user: currentUser,
          clients: {
            notification: {
              notifyOfInviteToJoin,
            },
          },
        } as unknown) as IContext;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
        });

        expect.assertions(2);

        try {
          await controller.resendInviteToJoinEmail(
            { userId: invitee.id },
            contextMock
          );
        } catch (err) {
          expect(err.message).toBe(RECIPIENT_COMPANY_CREATED_ERROR);
          expect(notifyOfInviteToJoin).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('when sender cannot be found', () => {
      it('should throw an error', async () => {
        const invitee = getCurrentUser({
          userOverrides: { id: supplierEditorUser2Mock.id },
          companyOverrides: {
            createdBy: inviter.id,
            status: CompanyStatus.PendingUserConfirmation,
          },
        });

        const findUser = jest.fn();
        findUser
          .mockImplementationOnce(() => invitee)
          .mockImplementationOnce(() => null);

        const userRepositoryMock = ({
          findOne: findUser,
        } as unknown) as UserRepository;

        const notifyOfInviteToJoin = jest.fn();
        const contextMock = ({
          user: currentUser,
          clients: {
            notification: {
              notifyOfInviteToJoin,
            },
          },
        } as unknown) as IContext;
        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
        });

        expect.assertions(2);

        try {
          await controller.resendInviteToJoinEmail(
            { userId: invitee.id },
            contextMock
          );
        } catch (err) {
          expect(err.message).toBe(SENDER_NOT_EXIST_ERROR);
          expect(notifyOfInviteToJoin).toHaveBeenCalledTimes(0);
        }
      });
    });
  });

  describe('deleteByCompanyId()', () => {
    const originalUserEmail = supplierEditorUserMock.email;

    afterEach(() => {
      supplierEditorUserMock.email = originalUserEmail;
    });

    it('should delete company users', async () => {
      const companyUsers = [supplierEditorUserMock];

      const saveAuditTrails = jest.fn();
      const contextMock = ({
        user: supplierEditorUserMock,
        controllers: {
          audit: { saveAuditTrails },
        },
      } as unknown) as IContext;

      const softDeleteUsers = jest.fn();
      softDeleteUsers.mockImplementation(() => [
        {
          ...supplierEditorUserMock,
          firstName: '',
          lastName: '',
          email: 'scrambledemail',
          isDeleted: true,
        },
      ]);

      const userRepositoryMock = ({
        find: () => companyUsers,
        softDeleteUsers,
      } as unknown) as UserRepository;

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const result = await controller.deleteByCompanyId(
        { companyId: supplierEditorUserMock.companyId },
        contextMock
      );

      const [[softDeleteCall]] = softDeleteUsers.mock.calls;
      expect(softDeleteCall).toEqual(
        expect.arrayContaining([supplierEditorUserMock])
      );

      const [[saveAuditCall]] = saveAuditTrails.mock.calls;

      expect(saveAuditCall).toEqual({
        auditTrails: [
          expect.objectContaining({
            userId: supplierEditorUserMock.id,
            action: USER_DELETED_ACTION,
            previousPayload: JSON.stringify({ id: supplierEditorUserMock.id }),
            currentPayload: JSON.stringify({ id: supplierEditorUserMock.id }),
          }),
        ],
      });

      expect(result).toBeUndefined();
    });
  });

  describe('activate', () => {
    it('should set the user status to ACTIVE', async () => {
      const pendingUser = {
        ...supplierEditorUserMock,
        status: UserStatus.Pending,
      };

      const userRepositoryMock = ({
        findOne: () => ({ ...pendingUser }),
        save: () => ({ ...pendingUser, status: UserStatus.Active }),
      } as unknown) as UserRepository;

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const saveAuditTrail = jest.fn();
      const context = ({
        user: pendingUser,
        controllers: {
          audit: {
            saveAuditTrail,
          },
        },
      } as unknown) as IContext;

      const result = await controller.activate(undefined, context);

      expect(result).toEqual(
        expect.objectContaining({
          status: UserStatus.Active,
        })
      );
    });

    it('should save user update audit trail', async () => {
      const pendingUser = {
        ...supplierEditorUserMock,
        status: UserStatus.Pending,
      };

      const userRepositoryMock = ({
        findOne: () => ({ ...pendingUser }),
        save: () => ({ ...pendingUser, status: UserStatus.Active }),
      } as unknown) as UserRepository;

      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });

      const saveAuditTrail = jest.fn();
      const context = ({
        user: pendingUser,
        controllers: {
          audit: {
            saveAuditTrail,
          },
        },
      } as unknown) as IContext;

      await controller.activate(undefined, context);

      const [[auditCall]] = saveAuditTrail.mock.calls;
      expect(auditCall).toEqual({
        userId: context.user.id,
        action: USER_EDITED_ACTION,
        previousPayload: JSON.stringify({
          id: pendingUser.id,
          authProvider: pendingUser.authProvider,
          status: pendingUser.status,
        }),
        currentPayload: JSON.stringify({
          id: pendingUser.id,
          authProvider: pendingUser.authProvider,
          status: UserStatus.Active,
        }),
      });
    });

    describe('when user company has status PENDING_USER_ACTIVATION', () => {
      it('should update the company status to ACTIVE', async () => {
        const pendingUser = {
          ...supplierEditorUserMock,
          status: UserStatus.Pending,
          companyId: companyMock.id,
          company: {
            ...companyMock,
            status: CompanyStatus.PendingUserActivation,
          },
        };

        const userRepositoryMock = ({
          findOne: () => ({ ...pendingUser }),
          save: () => ({ ...pendingUser, status: UserStatus.Active }),
        } as unknown) as UserRepository;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
        });

        const updateCompanyStatus = jest.fn();
        const context = ({
          user: pendingUser,
          controllers: {
            company: {
              updateCompanyStatus,
            },
            audit: {
              saveAuditTrail: jest.fn(),
            },
          },
        } as unknown) as IContext;

        await controller.activate(undefined, context);

        expect(updateCompanyStatus).toHaveBeenCalledWith(
          expect.objectContaining({
            id: companyMock.id,
            status: CompanyStatus.Active,
          }),
          expect.any(Object),
          undefined
        );
      });
    });

    describe.each`
      companyStatus
      ${CompanyStatus.Active}
      ${CompanyStatus.InvitationDeclined}
      ${CompanyStatus.PendingUserConfirmation}
      ${CompanyStatus.VettingInProgress}
      ${CompanyStatus.Vetoed}
    `(
      'when user company has status $companyStatus',
      ({ companyStatus }: { companyStatus: CompanyStatus }) => {
        it('should not update the company status', async () => {
          const pendingUser = {
            ...supplierEditorUserMock,
            status: UserStatus.Pending,
            companyId: companyMock.id,
            company: {
              ...companyMock,
              status: companyStatus,
            },
          };

          const userRepositoryMock = ({
            findOne: () => ({ ...pendingUser }),
            save: () => ({ ...pendingUser, status: UserStatus.Active }),
          } as unknown) as UserRepository;

          const controller = getUserControllerMock({
            userRepository: userRepositoryMock,
          });

          const updateCompanyStatus = jest.fn();
          const context = ({
            user: pendingUser,
            controllers: {
              company: {
                updateCompanyStatus,
              },
              audit: {
                saveAuditTrail: jest.fn(),
              },
            },
          } as unknown) as IContext;

          await controller.activate(undefined, context);

          expect(updateCompanyStatus).not.toHaveBeenCalled();
        });
      }
    );
  });

  describe('updateMe()', () => {
    const userRepositoryMock = ({
      findOne: () => undefined,
    } as unknown) as UserRepository;
    const controller = getUserControllerMock({
      userRepository: userRepositoryMock,
    });
    const userId = 'user-id';
    const context = ({
      user: {
        id: userId,
      },
    } as unknown) as IContext;
    it('throws an error when the authenticated user cannot be found', async () => {
      try {
        await controller.updateMe({ firstName: 'Testing' }, context);
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.message).toBe(USERS_DOES_NOT_EXIST_ERROR);
      }
      expect.assertions(2);
    });
    it.each`
      firstName    | lastName     | expertiseDomain
      ${undefined} | ${undefined} | ${undefined}
      ${''}        | ${''}        | ${undefined}
      ${'  '}      | ${undefined} | ${undefined}
      ${undefined} | ${'  '}      | ${undefined}
      ${'Test'}    | ${'McTest'}  | ${ExpertiseDomain.BusinessDevelopment}
      ${'Test'}    | ${undefined} | ${ExpertiseDomain.BusinessDevelopment}
      ${undefined} | ${'McTest'}  | ${ExpertiseDomain.BusinessDevelopment}
    `('throws error when there is nothing to update', async (input) => {
      const userRepositoryMock = ({
        findOne: () => ({
          firstName: 'Test',
          lastName: 'McTest',
          email: 'test@test.com',
          expertiseDomain: ExpertiseDomain.BusinessDevelopment,
        }),
      } as unknown) as UserRepository;
      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });
      const userId = 'user-id';
      const context = ({
        user: {
          id: userId,
        },
      } as unknown) as IContext;
      try {
        await controller.updateMe(input, context);
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.message).toBe(NOTHING_TO_UPDATE_ERROR);
      }
      expect.assertions(2);
    });
    it.each`
      firstName      | lastName
      ${' newName '} | ${' newLastName '}
      ${' newName '} | ${undefined}
      ${undefined}   | ${' newLastName '}
    `(
      'trims the values, updates the user when valid inputs are passed and inserts a record in Audit table',
      async (args) => {
        const userId = 'user-id';
        const accessToken = 'ACCESS_TOKEN';
        const userRepositoryMock = ({
          findOne: jest.fn(() =>
            Promise.resolve({
              id: userId,
              firstName: 'Test',
              lastName: 'McTest',
              email: 'test@test.com',
            })
          ),
          save: jest.fn(() => Promise.resolve()),
        } as unknown) as UserRepository;
        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
        });
        const context = ({
          user: {
            id: userId,
          },
          accessToken,
          controllers: {
            audit: {
              saveAuditTrail: jest.fn(),
            },
          },
          clients: {
            akamai: {
              updateProfile: jest.fn(),
            },
          },
        } as unknown) as IContext;
        await controller.updateMe(args, context);

        const expectedPayload = {
          ...(args.firstName ? { firstName: args.firstName.trim() } : {}),
          ...(args.lastName ? { lastName: args.lastName.trim() } : {}),
        };
        expect(userRepositoryMock.save).toHaveBeenCalledWith(
          expect.objectContaining(expectedPayload)
        );
        expect(context.controllers.audit.saveAuditTrail).toHaveBeenCalledWith(
          expect.objectContaining({
            userId,
            action: USER_EDITED_ACTION,
          }),
          context,
          undefined
        );
        expect(context.clients.akamai.updateProfile).toHaveBeenCalledWith(
          userId,
          expect.objectContaining(expectedPayload),
          accessToken
        );
      }
    );
    it("doesn't call to Akamai when only expertise domain is updated", async () => {
      const userRepositoryMock = ({
        findOne: jest.fn(() =>
          Promise.resolve({
            id: userId,
            email: 'test@test.com',
            expertiseDomain: ExpertiseDomain.Finance,
          })
        ),
        save: jest.fn(() => Promise.resolve()),
      } as unknown) as UserRepository;
      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });
      const context = ({
        user: {
          id: userId,
        },
        accessToken: 'ACCESS_TOKEN',
        controllers: {
          audit: {
            saveAuditTrail: jest.fn(),
          },
        },
        clients: {
          akamai: {
            updateProfile: jest.fn(),
          },
        },
      } as unknown) as IContext;

      const input = { expertiseDomain: ExpertiseDomain.Sustainability };
      await controller.updateMe(input, context);

      expect(context.controllers.audit.saveAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          action: USER_EDITED_ACTION,
        }),
        context,
        undefined
      );
      expect(userRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining(input)
      );
      expect(context.clients.akamai.updateProfile).not.toHaveBeenCalled();
    });
    it("doesn't call to Akamai when the user is a Example user", async () => {
      const userRepositoryMock = ({
        findOne: jest.fn(() =>
          Promise.resolve({
            id: userId,
            firstName: 'Test',
            lastName: 'McTest',
            email: 'test@example.com',
            expertiseDomain: ExpertiseDomain.Finance,
          })
        ),
        save: jest.fn(() => Promise.resolve()),
      } as unknown) as UserRepository;
      const controller = getUserControllerMock({
        userRepository: userRepositoryMock,
      });
      const context = ({
        user: {
          id: userId,
        },
        controllers: {
          audit: {
            saveAuditTrail: jest.fn(),
          },
        },
        clients: {
          akamai: {
            updateProfile: jest.fn(),
          },
        },
      } as unknown) as IContext;

      const input = { firstName: 'NewFirstName', lastName: 'NewLastName' };
      await controller.updateMe(input, context);

      expect(context.controllers.audit.saveAuditTrail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          action: USER_EDITED_ACTION,
        }),
        context,
        undefined
      );
      expect(userRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining(input)
      );
      expect(context.clients.akamai.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('resendAkamaiInvite()', () => {
    describe.each`
      role                       | companyId
      ${RoleName.Admin}          | ${undefined}
      ${RoleName.SupplierEditor} | ${supplierEditorUserMock.companyId}
    `(
      'when current user is $role',
      ({ role, companyId }: { role: RoleName; companyId?: string }) => {
        const currentUser = {
          id: 'currentUserId',
          roles: [{ name: role }],
          companyId,
        };

        describe('when the user being sent an invite is has AKAMAI as their auth provider', () => {
          const userToResendInviteTo = supplierEditorUserMock;

          it('should resend the invite', async () => {
            const resendInvite = jest.fn();
            const userRepositoryMock = ({
              findOne: jest.fn(() => Promise.resolve(userToResendInviteTo)),
            } as unknown) as UserRepository;

            const controller = getUserControllerMock({
              userRepository: userRepositoryMock,
            });

            const context = ({
              user: currentUser,
              clients: {
                akamai: {
                  resendInvite,
                },
              },
            } as unknown) as IContext;

            await controller.resendAkamaiInvite(
              { userId: userToResendInviteTo.id },
              context
            );

            expect(resendInvite).toHaveBeenCalledWith(
              userToResendInviteTo.email
            );
          });
        });

        describe.each`
          authProvider
          ${AuthProvider.Invite}
          ${AuthProvider.Port}
        `(
          'when the user being sent an invite is has $authProvider as their auth provider',
          ({ authProvider }: { authProvider: AuthProvider }) => {
            it('should throw an error', async () => {
              const userToResendInviteTo = {
                ...supplierEditorUserMock,
                authProvider,
              };

              const resendInvite = jest.fn();
              const userRepositoryMock = ({
                findOne: jest.fn(() => Promise.resolve(userToResendInviteTo)),
              } as unknown) as UserRepository;

              const controller = getUserControllerMock({
                userRepository: userRepositoryMock,
              });

              const context = ({
                user: currentUser,
                clients: {
                  akamai: {
                    resendInvite,
                  },
                },
              } as unknown) as IContext;

              expect.assertions(2);

              try {
                await controller.resendAkamaiInvite(
                  { userId: userToResendInviteTo.id },
                  context
                );
              } catch (err) {
                expect(err.message).toBe(WRONG_AUTH_PROVIDER_ERROR);
                expect(resendInvite).not.toHaveBeenCalledWith();
              }
            });
          }
        );

        describe('when the user being sent an invite does not exist', () => {
          it('should throw an error', async () => {
            const userToResendInviteTo = supplierEditorUserMock;

            const resendInvite = jest.fn();

            const userRepositoryMock = ({
              findOne: jest.fn(() => Promise.resolve(undefined)),
            } as unknown) as UserRepository;

            const controller = getUserControllerMock({
              userRepository: userRepositoryMock,
            });

            const context = ({
              user: currentUser,
              clients: {
                akamai: {
                  resendInvite,
                },
              },
            } as unknown) as IContext;

            expect.assertions(2);

            try {
              await controller.resendAkamaiInvite(
                { userId: userToResendInviteTo.id },
                context
              );
            } catch (err) {
              expect(err.message).toBe(RECIPIENT_NOT_EXIST_ERROR);
              expect(resendInvite).not.toHaveBeenCalledWith();
            }
          });
        });
      }
    );

    describe('when authenticated user is an external user who does not belong to the company of the user being sent an invite', () => {
      it('should throw an error', async () => {
        const resendInvite = jest.fn();

        const randomCompanyId = '';
        const currentUser = {
          id: 'currentUserId',
          roles: [{ name: RoleName.SupplierEditor }],
          companyId: randomCompanyId,
        };

        const contextMock = ({
          user: currentUser,
          clients: {
            akamai: {
              resendInvite,
            },
          },
        } as unknown) as IContext;

        const userRepositoryMock = ({
          findOne: () => ({ ...supplierEditorUserMock }),
        } as unknown) as UserRepository;

        const controller = getUserControllerMock({
          userRepository: userRepositoryMock,
        });

        expect.assertions(2);

        try {
          await controller.resendAkamaiInvite(
            { userId: supplierEditorUserMock.id },
            contextMock
          );
        } catch (err) {
          expect(err.message).toBe(
            RESEND_INVITE_USER_NOT_PART_OF_COMPANY_ERROR
          );
          expect(resendInvite).not.toHaveBeenCalledWith();
        }
      });
    });
  });
});
