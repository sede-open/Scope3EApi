import { getApolloServer } from '../apollo';

import { authenticateUser } from '../auth';
import { AkamaiClient } from '../clients/AkamaiClient';
import { getOrCreateConnection } from '../dbConnection';
import { ExpertiseDomain, RoleName } from '../types';
import { createUserMock } from '../mocks/user';
import { NOTHING_TO_UPDATE_ERROR } from '../controllers/UserController';
import { ApolloError } from 'apollo-server-express';
import { createCompanyMock } from '../mocks/company';
import { Connection, In, Repository } from 'typeorm';
import { CompanySectorEntity } from '../entities/CompanySector';
import { CompanyEntity } from '../entities/Company';
import { SectorEntity } from '../entities/Sector';
import { createCompanySectorMock } from '../mocks/companySector';
import { createSectorMock } from '../mocks/sector';
import { UserRepository } from '../repositories/UserRepository';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('../auth');
jest.mock('../clients/AkamaiClient', () => ({
  AkamaiClient: jest.fn(),
}));

const primaryCompanySectorId =  '';
const secondaryCompanySectorId =  '';
const anotherCompanySectorId =  '';

const companyId =  '';
const anotherCompanyId =  '';

const sectorId =  '';
const anotherSectorId =  '';
const sectorName = 'Specialised sector for specialised people';
const anotherSectorName = 'Another specialised sector';

const adminId =  '';
const userId =  '';
const adminFirstName = 'adminFirstName';
const adminLastName = 'adminLastName';
const firstName = 'firstName';
const lastName = 'lastName';
const expertiseDomain = ExpertiseDomain.Sustainability;

const setup = async (
  companySectorRepository: Repository<CompanySectorEntity>,
  companyRepository: Repository<CompanyEntity>,
  sectorRepository: Repository<SectorEntity>,
  userRepository: UserRepository
) => {
  await userRepository.save([
    await createUserMock(
      {
        id: adminId,
        firstName: adminFirstName,
        lastName: adminLastName,
      },
      RoleName.Admin
    ),
  ]);

  await companyRepository.save([
    createCompanyMock({ id: companyId, updatedBy: adminId }),
    createCompanyMock({ id: anotherCompanyId, updatedBy: adminId }),
  ]);

  await userRepository.save([
    await createUserMock(
      { id: userId, firstName, lastName, companyId, expertiseDomain },
      RoleName.SupplierEditor
    ),
  ]);

  await sectorRepository.save([
    createSectorMock({ id: sectorId, name: sectorName }),
    createSectorMock({ id: anotherSectorId, name: anotherSectorName }),
  ]);

  await companySectorRepository.save([
    createCompanySectorMock({
      id: primaryCompanySectorId,
      companyId,
      sectorId,
      createdBy: userId,
      updatedBy: userId,
    }),
    createCompanySectorMock({
      id: anotherCompanySectorId,
      companyId: anotherCompanyId,
      sectorId,
      createdBy: userId,
      updatedBy: userId,
    }),
  ]);
};

const teardown = async (
  companySectorRepository: Repository<CompanySectorEntity>,
  companyRepository: Repository<CompanyEntity>,
  sectorRepository: Repository<SectorEntity>,
  userRepository: UserRepository
) => {
  await companySectorRepository.delete({
    id: In([
      primaryCompanySectorId,
      secondaryCompanySectorId,
      anotherCompanySectorId,
    ]),
  });
  await sectorRepository.delete({ id: In([sectorId, anotherSectorId]) });
  await userRepository.deleteUsers([userId]);
  await companyRepository.delete({
    id: In([companyId, anotherCompanyId]),
  });
  await userRepository.deleteUsers([adminId]);
};

describe('meResolvers', () => {
  describe('me', () => {
    it('should return correct permissions for an editor role', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierEditor
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: {
          id: 'SOME_ID',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'McTest',
          role: { id: 'ROLE_ID', name: RoleName.SupplierEditor },
          roles,
        },
      }));

      const server = getApolloServer();
      const result = await server.executeOperation({
        query: `
        query {
          me {
            canViewUsersAdminDashboard
            canViewCompaniesAdminDashboard
            canViewSupplyDashboard
            canEditSupplyDashboard
            canViewCompanyRelationships
            canEditCompanyRelationships
            canViewEmissionAllocations
            canEditEmissionAllocations
            canEditCompanySectors
            canInviteNewCompanyMembers
          }
        }
      `,
      });

      expect(result.data?.me).toEqual({
        canViewUsersAdminDashboard: false,
        canViewCompaniesAdminDashboard: false,
        canViewSupplyDashboard: true,
        canEditSupplyDashboard: true,
        canViewCompanyRelationships: true,
        canEditCompanyRelationships: true,
        canViewEmissionAllocations: true,
        canEditEmissionAllocations: true,
        canEditCompanySectors: true,
        canInviteNewCompanyMembers: true,
      });
    });

    it('should return correct permissions for a viewer role', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.SupplierViewer
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: {
          id: 'SOME_ID',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'McTest',
          role: { id: 'ROLE_ID', name: RoleName.SupplierViewer },
          roles,
        },
      }));

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: `
        query {
          me {
            canViewUsersAdminDashboard
            canViewCompaniesAdminDashboard
            canViewSupplyDashboard
            canEditSupplyDashboard
            canViewCompanyRelationships
            canEditCompanyRelationships
            canViewEmissionAllocations
            canEditEmissionAllocations
            canEditCompanySectors
            canInviteNewCompanyMembers
          }
        }
      `,
      });

      expect(result.data?.me).toEqual({
        canViewUsersAdminDashboard: false,
        canViewCompaniesAdminDashboard: false,
        canViewSupplyDashboard: true,
        canEditSupplyDashboard: false,
        canViewCompanyRelationships: true,
        canEditCompanyRelationships: false,
        canViewEmissionAllocations: true,
        canEditEmissionAllocations: false,
        canEditCompanySectors: false,
        canInviteNewCompanyMembers: false,
      });
    });

    it('should return correct permissions for an admin role', async () => {
      const connection = await getOrCreateConnection();
      const roleRepository = connection.getCustomRepository(RoleRepository);
      const roles = await roleRepository.findAssumedRolesForRoleName(
        RoleName.Admin
      );
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user: {
          id: 'SOME_ID',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'McTest',
          role: { id: 'ROLE_ID', name: RoleName.Admin },
          roles,
        },
      }));

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: `
        query {
          me {
            canViewUsersAdminDashboard
            canViewCompaniesAdminDashboard
            canViewSupplyDashboard
            canEditSupplyDashboard
            canViewCompanyRelationships
            canEditCompanyRelationships
            canViewEmissionAllocations
            canEditEmissionAllocations
            canEditCompanySectors
            canInviteNewCompanyMembers
          }
        }
      `,
      });

      expect(result.data?.me).toEqual({
        canViewUsersAdminDashboard: true,
        canViewCompaniesAdminDashboard: true,
        canViewSupplyDashboard: true,
        canEditSupplyDashboard: true,
        canViewCompanyRelationships: true,
        canEditCompanyRelationships: true,
        canViewEmissionAllocations: true,
        canEditEmissionAllocations: true,
        canEditCompanySectors: true,
        canInviteNewCompanyMembers: true,
      });
    });
  });

  describe('updateMe', () => {
    const updateMeMutation = `
      mutation updateMe($input: UpdateMeInput!) {
        updateMe(input: $input) {
          id
          firstName
          lastName
          expertiseDomain
        }
      }
    `;
    let connection: Connection;
    let companySectorRepository: Repository<CompanySectorEntity>;
    let companyRepository: Repository<CompanyEntity>;
    let sectorRepository: Repository<SectorEntity>;
    let userRepository: UserRepository;

    beforeAll(async () => {
      connection = await getOrCreateConnection();
      companySectorRepository = await connection.getRepository(
        CompanySectorEntity
      );
      companyRepository = await connection.getRepository(CompanyEntity);
      sectorRepository = await connection.getRepository(SectorEntity);
      userRepository = await connection.getCustomRepository(UserRepository);
    });

    beforeEach(async () => {
      await teardown(
        companySectorRepository,
        companyRepository,
        sectorRepository,
        userRepository
      );
      await setup(
        companySectorRepository,
        companyRepository,
        sectorRepository,
        userRepository
      );
    });

    afterAll(async () => {
      await teardown(
        companySectorRepository,
        companyRepository,
        sectorRepository,
        userRepository
      );
    });

    it('successfully updates the user entity firstName, lastName and expertiseDomain', async () => {
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      const accessToken = 'ACCESS_TOKEN';
      const input = {
        firstName: 'Test',
        lastName: 'McTest',
        expertiseDomain: ExpertiseDomain.Finance,
      };

      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user,
        accessToken,
      }));

      const mockUpdateProfile = jest.fn(() => Promise.resolve());
      ((AkamaiClient as unknown) as jest.Mock).mockImplementation(() => {
        const actualAkamaiClient = jest.requireActual(
          '../clients/AkamaiClient'
        );
        return {
          ...actualAkamaiClient,
          updateProfile: mockUpdateProfile,
        };
      });

      const server = getApolloServer();

      const result = await server.executeOperation({
        query: updateMeMutation,
        variables: { input },
      });
      const userRow = await userRepository.findOne(userId);

      expect(mockUpdateProfile).toHaveBeenCalledWith(
        userId,
        expect.anything(),
        accessToken
      );
      expect(userRow).toEqual(expect.objectContaining(input));
      expect(result.data?.updateMe).toEqual(expect.objectContaining(input));
    });

    it('gives an error response when the same values are provided as the user already has', async () => {
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['roles'],
      });
      ((authenticateUser as unknown) as jest.Mock).mockImplementation(() => ({
        user,
      }));
      const mockUpdateProfile = jest.fn(() => Promise.resolve());
      ((AkamaiClient as unknown) as jest.Mock).mockImplementation(() => {
        const actualAkamaiClient = jest.requireActual(
          '../clients/AkamaiClient'
        );
        return {
          ...actualAkamaiClient,
          updateProfile: mockUpdateProfile,
        };
      });

      const server = getApolloServer();

      const input = {
        firstName,
        lastName,
        expertiseDomain,
      };
      const result = await server.executeOperation({
        query: updateMeMutation,
        variables: { input },
      });

      const userRow = await userRepository.findOne(userId);

      expect(userRow).toEqual(expect.objectContaining(input));
      expect(mockUpdateProfile).not.toHaveBeenCalled();
      expect(result.errors).toEqual([new ApolloError(NOTHING_TO_UPDATE_ERROR)]);
    });
  });
});
