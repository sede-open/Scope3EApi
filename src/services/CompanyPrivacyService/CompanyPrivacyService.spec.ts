import { CompanyPrivacyService } from '.';
import { HubspotEmailClient } from '../../clients/HubspotEmailClient';
import { DATA_SHARE_REQUEST_INSERTED } from '../../constants/audit';
import { CompanyPrivacyEntity } from '../../entities/CompanyPrivacy';
import { ContextUser } from '../../entities/User';
import { CompanyPrivacyRepository } from '../../repositories/CompanyPrivacyRepository';
import { CompanyPrivacy } from '../../repositories/CompanyPrivacyRepository/types';
import { DataShareRequestRepository } from '../../repositories/DataShareRequest';
import { CompanyRelationshipType } from '../../types';
import { getCompanyPrivacy } from '../../utils/companyPrivacy';
import { AuditService } from '../AuditService';
import { CompanyRelationshipService } from '../CompanyRelationshipService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { UserService } from '../UserService';

describe('CompanyPrivacyService', () => {
  const companyPrivacyRepositoryMock = {
    async createEntity(
      attributes: CompanyPrivacy
    ): Promise<CompanyPrivacy & CompanyPrivacyEntity> {
      return attributes as CompanyPrivacyEntity;
    },
  };

  const databaseServiceMock = ({
    getRepository: () => {
      return companyPrivacyRepositoryMock;
    },
  } as unknown) as DatabaseService;

  describe('create()', () => {
    it('should create company privacy', async () => {
      const service = new CompanyPrivacyService(
        databaseServiceMock,
        {} as CompanyRelationshipService,
        {} as UserService,
        {} as AuditService,
        {} as HubspotEmailClient
      );
      const companyPrivacy = getCompanyPrivacy();
      const result = await service.create(companyPrivacy);
      expect(result).toEqual(companyPrivacy);
    });
  });

  describe('hasAccessToCompanyData', () => {
    it('should return false if company privacy does not exist', async () => {
      const companyId = 'companyId';
      const targetCompanyId = 'targetCompanyId';
      const companyPrivacy = undefined;
      const findOne = jest.fn().mockResolvedValue(companyPrivacy);

      const dbMock = ({
        getRepository: jest.fn().mockResolvedValue({ findOne }),
      } as unknown) as DatabaseService;
      const service = new CompanyPrivacyService(
        dbMock,
        {} as CompanyRelationshipService,
        {} as UserService,
        {} as AuditService,
        {} as HubspotEmailClient
      );
      const result = await service.hasAccessToCompanyData(
        companyId,
        targetCompanyId
      );

      expect(dbMock.getRepository).toHaveBeenCalledWith(
        CompanyPrivacyRepository
      );
      expect(findOne).toHaveBeenCalledWith({
        where: { companyId: targetCompanyId },
      });
      expect(result).toEqual({ hasAccess: false, companyPrivacy });
    });
    it('should return true if company privacy exists and allPlatform is true', async () => {
      const companyId = 'companyId';
      const targetCompanyId = 'targetCompanyId';
      const companyPrivacy = { allPlatform: true };
      const findOne = jest.fn().mockResolvedValue(companyPrivacy);

      const dbMock = ({
        getRepository: jest.fn().mockResolvedValue({ findOne }),
      } as unknown) as DatabaseService;
      const service = new CompanyPrivacyService(
        dbMock,
        {} as CompanyRelationshipService,
        {} as UserService,
        {} as AuditService,
        {} as HubspotEmailClient
      );
      const result = await service.hasAccessToCompanyData(
        companyId,
        targetCompanyId
      );

      expect(dbMock.getRepository).toHaveBeenCalledWith(
        CompanyPrivacyRepository
      );
      expect(findOne).toHaveBeenCalledWith({
        where: { companyId: targetCompanyId },
      });
      expect(result).toEqual({
        hasAccess: true,
        companyPrivacy,
      });
    });

    it.each`
      relationshipType                    | targetCompanyPrivacy          | expected
      ${CompanyRelationshipType.Customer} | ${{ customerNetwork: true }}  | ${true}
      ${CompanyRelationshipType.Customer} | ${{ customerNetwork: false }} | ${false}
      ${CompanyRelationshipType.Supplier} | ${{ supplierNetwork: true }}  | ${true}
      ${CompanyRelationshipType.Supplier} | ${{ supplierNetwork: false }} | ${false}
    `(
      'returns $expected if the target company has "$targetCompanyPrivacy" privacy and the user company is a $relationshipType',
      async ({ relationshipType, targetCompanyPrivacy, expected }) => {
        const companyId = 'companyId';
        const targetCompanyId = 'targetCompanyId';
        const findOne = jest.fn().mockResolvedValue(targetCompanyPrivacy);

        const dbMock = ({
          getRepository: jest.fn().mockResolvedValue({ findOne }),
        } as unknown) as DatabaseService;
        const findActiveRelationship = jest
          .fn()
          .mockResolvedValue(relationshipType);
        const companyRelationshipServiceMock = ({
          findActiveRelationship,
        } as unknown) as CompanyRelationshipService;
        const service = new CompanyPrivacyService(
          dbMock,
          companyRelationshipServiceMock,
          {} as UserService,
          {} as AuditService,
          {} as HubspotEmailClient
        );
        const result = await service.hasAccessToCompanyData(
          companyId,
          targetCompanyId
        );

        expect(dbMock.getRepository).toHaveBeenCalledWith(
          CompanyPrivacyRepository
        );
        expect(findOne).toHaveBeenCalledWith({
          where: { companyId: targetCompanyId },
        });
        expect(findActiveRelationship).toHaveBeenCalledWith(
          targetCompanyId,
          companyId
        );
        expect(result).toEqual({
          hasAccess: expected,
          companyPrivacy: targetCompanyPrivacy,
        });
      }
    );
  });
  describe('findDataShareRequest', () => {
    it('throws an error when the companyId and the targetCompanyId are the same', async () => {
      const companyId = 'companyId';
      const service = new CompanyPrivacyService(
        {} as DatabaseService,
        {} as CompanyRelationshipService,
        {} as UserService,
        {} as AuditService,
        {} as HubspotEmailClient
      );
      await expect(
        service.findDataShareRequest(companyId, companyId)
      ).rejects.toThrowError(
        'You cannot request to find a relationship with yourself'
      );
    });
    it('finds the data share request', async () => {
      const companyId = 'companyId';
      const targetCompanyId = 'targetCompanyId';
      const findOne = jest.fn().mockResolvedValue({});

      const dbMock = ({
        getRepository: jest.fn().mockResolvedValue({ findOne }),
      } as unknown) as DatabaseService;
      const service = new CompanyPrivacyService(
        dbMock,
        {} as CompanyRelationshipService,
        {} as UserService,
        {} as AuditService,
        {} as HubspotEmailClient
      );
      await service.findDataShareRequest(companyId, targetCompanyId);

      expect(dbMock.getRepository).toHaveBeenCalledWith(
        DataShareRequestRepository
      );
      expect(findOne).toHaveBeenCalledWith({
        targetCompanyId,
        companyId,
      });
    });
  });
  describe('sendDataShareRequest', () => {
    it('throws an error when the company has access to the target company data', async () => {
      const user = {
        companyId: 'companyId',
      } as ContextUser;
      const targetCompanyId = 'targetCompanyId';
      const hasAccessToCompanyData = jest
        .fn()
        .mockResolvedValue({ hasAccess: true });
      const service = new CompanyPrivacyService(
        {} as DatabaseService,
        {} as CompanyRelationshipService,
        {} as UserService,
        {} as AuditService,
        {} as HubspotEmailClient
      );
      service.hasAccessToCompanyData = hasAccessToCompanyData;
      await expect(
        service.sendDataShareRequest(targetCompanyId, user)
      ).rejects.toThrowError('You already have access to this company data');
      expect(hasAccessToCompanyData).toHaveBeenCalledWith(
        user.companyId,
        targetCompanyId
      );
    });
    it('throws an error when the company has already requested access to the target company data', async () => {
      const user = {
        companyId: 'companyId',
      } as ContextUser;
      const targetCompanyId = 'targetCompanyId';
      const hasAccessToCompanyData = jest
        .fn()
        .mockResolvedValue({ hasAccess: false });
      const findDataShareRequest = jest.fn().mockResolvedValue({});
      const service = new CompanyPrivacyService(
        {} as DatabaseService,
        {} as CompanyRelationshipService,
        {} as UserService,
        {} as AuditService,
        {} as HubspotEmailClient
      );
      service.hasAccessToCompanyData = hasAccessToCompanyData;
      service.findDataShareRequest = findDataShareRequest;
      await expect(
        service.sendDataShareRequest(targetCompanyId, user)
      ).rejects.toThrowError(
        'You already requested access to this company data'
      );
      expect(hasAccessToCompanyData).toHaveBeenCalledWith(
        user.companyId,
        targetCompanyId
      );
      expect(findDataShareRequest).toHaveBeenCalledWith(
        user.companyId,
        targetCompanyId
      );
    });
    it('sends request to the company editors', async () => {
      const user = {
        companyId: 'companyId',
        id: 'userId',
        firstName: 'firstName',
        lastName: 'lastName',
        company: { name: 'companyName' },
      } as ContextUser;
      const targetCompanyId = 'targetCompanyId';
      const hasAccessToCompanyData = jest
        .fn()
        .mockResolvedValue({ hasAccess: false });
      const findDataShareRequest = jest.fn().mockResolvedValue(undefined);
      const companyEditor = {
        email: 'test@test.com',
        firstName: 'test',
        lastName: 'test',
      };
      const userServiceMock = ({
        findCompanyEditors: jest.fn().mockResolvedValue([companyEditor]),
      } as unknown) as UserService;
      const dataShareRequestSave = jest.fn().mockResolvedValue({});
      const dbService = ({
        getRepository: jest
          .fn()
          .mockResolvedValueOnce({ save: dataShareRequestSave }),
        transaction: jest.fn().mockImplementation((callback) => callback()),
      } as unknown) as DatabaseService;
      const hubspotEmailClient = ({
        sendDataShareRequestEmail: jest.fn().mockResolvedValue({}),
      } as unknown) as HubspotEmailClient;
      const auditService = ({
        createEntity: jest.fn().mockResolvedValue({}),
      } as unknown) as AuditService;
      const service = new CompanyPrivacyService(
        dbService,
        {} as CompanyRelationshipService,
        userServiceMock,
        auditService,
        hubspotEmailClient
      );
      service.hasAccessToCompanyData = hasAccessToCompanyData;
      service.findDataShareRequest = findDataShareRequest;

      await service.sendDataShareRequest(targetCompanyId, user);

      expect(hasAccessToCompanyData).toHaveBeenCalledWith(
        user.companyId,
        targetCompanyId
      );
      expect(findDataShareRequest).toHaveBeenCalledWith(
        user.companyId,
        targetCompanyId
      );
      expect(userServiceMock.findCompanyEditors).toHaveBeenCalledWith(
        targetCompanyId
      );
      expect(hubspotEmailClient.sendDataShareRequestEmail).toHaveBeenCalledWith(
        {
          recipient: {
            email: companyEditor.email,
            firstName: companyEditor.firstName,
            lastName: companyEditor.lastName,
          },
          requesterName: `${user.firstName} ${user.lastName}`,
          requesterCompanyName: user.company.name,
        }
      );
      expect(dbService.transaction).toHaveBeenCalled();
      expect(dbService.getRepository).toHaveBeenCalledWith(
        DataShareRequestRepository
      );
      expect(auditService.createEntity).toHaveBeenCalledWith(
        { userId: user.id, action: DATA_SHARE_REQUEST_INSERTED },
        { companyId: user.companyId, targetCompanyId, createdBy: user.id },
        {}
      );
      expect(dataShareRequestSave).toHaveBeenCalledWith({
        companyId: user.companyId,
        targetCompanyId,
        createdBy: user.id,
      });
    });
  });
});
