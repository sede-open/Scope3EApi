import { Repository } from 'typeorm';
import { TargetController } from '.';
import {
  TARGET_DOESNT_EXIST,
  TARGET_SCOPE_3_FIELDS_INVALID,
} from './constants';
import { IContext } from '../../apolloContext';
import { TargetEntity } from '../../entities/Target';
import { companyMock } from '../../mocks/company';

import { targetMock, targetScope3Mock } from '../../mocks/target';
import { supplierEditorUserMock } from '../../mocks/user';
import { TargetPrivacyType, TargetType } from '../../types';
import { mergeTargetData, preExistingTargetTypeForCompany } from './utils';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import { CompanyPrivacyService } from '../../services/CompanyPrivacyService';
import { TargetService } from '../../services/TargetService';

describe('TargetController', () => {
  describe('findAbsoluteTargetByCompanyId()', () => {
    describe('when the user requests his own company data', () => {
      it('should return target entry for a company', async () => {
        const targets = [targetMock, targetScope3Mock];
        const find = jest.fn();
        const targetRepositoryMock = ({
          find,
        } as unknown) as Repository<TargetEntity>;
        find.mockImplementation(() => targets);
        const mockContext = ({
          user: supplierEditorUserMock,
        } as unknown) as IContext;

        const controller = new TargetController(
          targetRepositoryMock,
          {} as CompanyPrivacyService,
          {} as TargetService
        );

        const result = await controller.findAbsoluteTargetByCompanyId(
          { companyId: companyMock.id },
          mockContext
        );

        expect(find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              companyId: targetMock.companyId,
              targetType: TargetType.Absolute,
            },
          })
        );
        expect(result).toEqual(
          mergeTargetData({
            scope1And2Target: (targetMock as unknown) as TargetEntity,
            scope3Target: (targetScope3Mock as unknown) as TargetEntity,
          })
        );
      });
    });

    describe('when the user requests another company data', () => {
      it('should return undefined the user has no access to the target company data', async () => {
        const find = jest.fn();
        const targetRepositoryMock = ({
          find,
        } as unknown) as Repository<TargetEntity>;
        const hasAccessToCompanyData = jest.fn().mockResolvedValueOnce(false);
        const companyPrivacyServiceMock = ({
          hasAccessToCompanyData,
        } as unknown) as CompanyPrivacyService;
        const mockContext = ({
          user: { ...supplierEditorUserMock, companyId: 'another_id' },
        } as unknown) as IContext;

        const controller = new TargetController(
          targetRepositoryMock,
          companyPrivacyServiceMock,
          {} as TargetService
        );

        const result = await controller.findAbsoluteTargetByCompanyId(
          { companyId: companyMock.id },
          mockContext
        );

        expect(hasAccessToCompanyData).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
        expect(find).not.toHaveBeenCalled();
      });

      it('returns undefined when the user has access to the target company data, but the scope 1,2 target is private', async () => {
        const targets = [
          { ...targetMock, privacyType: TargetPrivacyType.Private },
          targetScope3Mock,
        ];
        const find = jest.fn().mockResolvedValueOnce(targets);
        const targetRepositoryMock = ({
          find,
        } as unknown) as Repository<TargetEntity>;
        const hasAccessToCompanyData = jest
          .fn()
          .mockResolvedValueOnce({ hasAccess: true });
        const companyPrivacyServiceMock = ({
          hasAccessToCompanyData,
        } as unknown) as CompanyPrivacyService;
        const mockContext = ({
          user: { ...supplierEditorUserMock, companyId: 'another_id' },
        } as unknown) as IContext;

        const controller = new TargetController(
          targetRepositoryMock,
          companyPrivacyServiceMock,
          {} as TargetService
        );

        const result = await controller.findAbsoluteTargetByCompanyId(
          { companyId: companyMock.id },
          mockContext
        );

        expect(hasAccessToCompanyData).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
        expect(find).toHaveBeenCalledWith({
          where: {
            companyId: companyMock.id,
            targetType: TargetType.Absolute,
          },
        });
      });

      it('returns the target entry without scope 3 data when the user has access to the target company data, but the scope 3 target is private', async () => {
        const targets = [
          targetMock,
          { ...targetScope3Mock, privacyType: TargetPrivacyType.Private },
        ];
        const find = jest.fn().mockResolvedValueOnce(targets);
        const targetRepositoryMock = ({
          find,
        } as unknown) as Repository<TargetEntity>;
        const hasAccessToCompanyData = jest
          .fn()
          .mockResolvedValueOnce({ hasAccess: true });
        const companyPrivacyServiceMock = ({
          hasAccessToCompanyData,
        } as unknown) as CompanyPrivacyService;
        const mockContext = ({
          user: { ...supplierEditorUserMock, companyId: 'another_id' },
        } as unknown) as IContext;

        const controller = new TargetController(
          targetRepositoryMock,
          companyPrivacyServiceMock,
          {} as TargetService
        );

        const result = await controller.findAbsoluteTargetByCompanyId(
          { companyId: companyMock.id },
          mockContext
        );

        expect(hasAccessToCompanyData).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          scope1And2Year: targetMock.year,
          scope1And2Reduction: targetMock.reduction,
          scope3Year: undefined,
          scope3Reduction: undefined,
          strategy: targetMock.strategy,
          includeCarbonOffset: targetMock.includeCarbonOffset,
          scope1And2PrivacyType: targetMock.privacyType,
          scope3PrivacyType: undefined,
          companyId: targetMock.companyId,
        });
        expect(find).toHaveBeenCalledWith({
          where: {
            companyId: companyMock.id,
            targetType: TargetType.Absolute,
          },
        });
      });

      it('should return target entry when the user has access to the target company data', async () => {
        const targets = [targetMock, targetScope3Mock];
        const find = jest.fn().mockResolvedValueOnce(targets);
        const targetRepositoryMock = ({
          find,
        } as unknown) as Repository<TargetEntity>;
        const hasAccessToCompanyData = jest
          .fn()
          .mockResolvedValueOnce({ hasAccess: true });
        const companyPrivacyServiceMock = ({
          hasAccessToCompanyData,
        } as unknown) as CompanyPrivacyService;
        const mockContext = ({
          user: { ...supplierEditorUserMock, companyId: 'another_id' },
        } as unknown) as IContext;

        const controller = new TargetController(
          targetRepositoryMock,
          companyPrivacyServiceMock,
          {} as TargetService
        );

        const result = await controller.findAbsoluteTargetByCompanyId(
          { companyId: companyMock.id },
          mockContext
        );

        expect(hasAccessToCompanyData).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
          scope1And2Year: targetMock.year,
          scope1And2Reduction: targetMock.reduction,
          scope3Year: targetScope3Mock.year,
          scope3Reduction: targetScope3Mock.reduction,
          strategy: targetMock.strategy,
          includeCarbonOffset: targetMock.includeCarbonOffset,
          scope1And2PrivacyType: targetMock.privacyType,
          scope3PrivacyType: targetScope3Mock.privacyType,
          companyId: targetMock.companyId,
        });
        expect(find).toHaveBeenCalledWith({
          where: { companyId: companyMock.id, targetType: TargetType.Absolute },
        });
      });
    });
  });

  describe('findTargetsByCompanyId', () => {
    it("calls to get the users targets when the companyId is the user's companyId", async () => {
      const userCompanyId = 'userCompanyId';
      const targetService = ({
        findMyTargets: jest.fn(),
        findTargetsByCompanyId: jest.fn(),
      } as unknown) as TargetService;
      const mockContext = ({
        user: { companyId: userCompanyId },
      } as unknown) as IContext;

      const controller = new TargetController(
        {} as Repository<TargetEntity>,
        {} as CompanyPrivacyService,
        targetService
      );
      await controller.findTargetsByCompanyId(
        { companyId: userCompanyId },
        mockContext
      );

      expect(targetService.findMyTargets).toHaveBeenCalledTimes(1);
      expect(targetService.findMyTargets).toHaveBeenCalledWith(userCompanyId);
      expect(targetService.findTargetsByCompanyId).not.toHaveBeenCalled();
    });
    it('calls to get the targets by companyId when the user is not in the company', async () => {
      const userCompanyId = 'userCompanyId';
      const targetCompanyId = 'targetCompanyId';
      const targetService = ({
        findMyTargets: jest.fn(),
        findTargetsByCompanyId: jest.fn(),
      } as unknown) as TargetService;
      const mockContext = ({
        user: { companyId: userCompanyId },
      } as unknown) as IContext;

      const controller = new TargetController(
        {} as Repository<TargetEntity>,
        {} as CompanyPrivacyService,
        targetService
      );
      await controller.findTargetsByCompanyId(
        { companyId: targetCompanyId },
        mockContext
      );

      expect(targetService.findTargetsByCompanyId).toHaveBeenCalledTimes(1);
      expect(targetService.findTargetsByCompanyId).toHaveBeenCalledWith(
        targetCompanyId,
        userCompanyId
      );
      expect(targetService.findMyTargets).not.toHaveBeenCalled();
    });
  });

  describe('createTarget()', () => {
    it('should throw an error if user does not belong to the company', async () => {
      const mockContext = ({
        user: { ...supplierEditorUserMock, companyId: 'failCompanyId' },
      } as unknown) as IContext;
      const controller = new TargetController(
        (jest.fn() as unknown) as Repository<TargetEntity>,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.createTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should throw an error if a target already exists', async () => {
      const targetRepositoryMock = ({
        find: () => [targetMock],
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.createTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(
          preExistingTargetTypeForCompany(TargetType.Absolute)
        );
      }
    });

    it('should throw an error if scope 3 year is provided but not reduction', async () => {
      const targetRepositoryMock = ({
        find: () => [targetMock],
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.createTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope3Year: targetScope3Mock.year,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(TARGET_SCOPE_3_FIELDS_INVALID);
      }
    });

    it('should throw an error if scope 3 reduction is provided but not year', async () => {
      const targetRepositoryMock = ({
        find: () => [targetMock],
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.createTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope3Reduction: targetScope3Mock.reduction,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(TARGET_SCOPE_3_FIELDS_INVALID);
      }
    });
  });

  describe('updateTarget()', () => {
    it('should throw an error if the user does not belong to the company', async () => {
      const targetRepositoryMock = ({
        save: jest.fn(),
        find: () => targetMock,
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: { ...supplierEditorUserMock, companyId: 'randomId' },
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.updateTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(USER_COMPANY_ERROR);
      }
    });

    it('should throw an error no targets have been set for the company', async () => {
      const targetRepositoryMock = ({
        save: jest.fn(),
        find: () => [],
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.updateTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(TARGET_DOESNT_EXIST);
      }
    });

    it('should throw an error if scope 3 year is provided but not reduction', async () => {
      const targetRepositoryMock = ({
        find: () => [targetMock],
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.updateTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope3Year: targetScope3Mock.year,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(TARGET_SCOPE_3_FIELDS_INVALID);
      }
    });

    it('should throw an error if scope 3 reduction is provided but not year', async () => {
      const targetRepositoryMock = ({
        find: () => [targetMock],
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      try {
        await controller.updateTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope3Reduction: targetScope3Mock.reduction,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(TARGET_SCOPE_3_FIELDS_INVALID);
      }
    });

    it('should throw an error if scope 3 reduction is 0 and year is undefined', async () => {
      const targetRepositoryMock = ({
        find: () => [targetMock],
      } as unknown) as Repository<TargetEntity>;

      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;
      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );
      try {
        await controller.updateTarget(
          {
            companyId: targetMock.companyId,
            scope1And2Reduction: targetMock.reduction,
            strategy: targetMock.strategy,
            scope1And2Year: targetMock.year,
            includeCarbonOffset: targetMock.includeCarbonOffset,
            scope3Reduction: 0,
            targetType: TargetType.Absolute,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(TARGET_SCOPE_3_FIELDS_INVALID);
      }
    });

    it('should not throw an error if scope 3 reduction and year are undefined', async () => {
      const targets = [targetMock];
      const find = jest.fn();
      const targetRepositoryMock = ({
        find,
        manager: {
          transaction: jest.fn(),
        },
      } as unknown) as Repository<TargetEntity>;
      find.mockImplementation(() => targets);

      const mockContext = ({
        user: supplierEditorUserMock,
        controllers: {
          audit: {
            saveAuditTrail: jest.fn(),
          },
        },
      } as unknown) as IContext;

      const controller = new TargetController(
        targetRepositoryMock,
        {} as CompanyPrivacyService,
        {} as TargetService
      );

      const result = await controller.updateTarget(
        {
          companyId: targetMock.companyId,
          scope1And2Reduction: targetMock.reduction,
          strategy: targetMock.strategy,
          scope1And2Year: targetMock.year,
          includeCarbonOffset: targetMock.includeCarbonOffset,
          targetType: TargetType.Absolute,
        },
        mockContext
      );

      expect(result).toEqual(
        mergeTargetData({
          scope1And2Target: (targetMock as unknown) as TargetEntity,
        })
      );
    });
  });
});
