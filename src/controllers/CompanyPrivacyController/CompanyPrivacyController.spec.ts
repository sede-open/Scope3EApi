import { CANNOT_REQUEST_YOUR_COMPANY, CompanyPrivacyController } from '.';
import { IContext } from '../../apolloContext';
import { UserEntityWithRoles } from '../../entities/User';
import { CompanyPrivacyService } from '../../services/CompanyPrivacyService';
import { getCompanyPrivacyInput } from '../../utils/companyPrivacy';

describe('CompanyPrivacyController', () => {
  const userMock = ({
    companyId: 'test',
  } as unknown) as UserEntityWithRoles;

  const contextMock = { user: userMock } as IContext;

  describe('create()', () => {
    it('should create company privacy', async () => {
      const createMock = jest.fn();
      const service = ({
        create: createMock,
      } as unknown) as CompanyPrivacyService;
      const controller = new CompanyPrivacyController(service);
      await controller.create(getCompanyPrivacyInput(), contextMock);
      expect(createMock).toHaveBeenCalledWith({
        allPlatform: false,
        companyId: 'test',
        customerNetwork: false,
        supplierNetwork: false,
      });
    });
  });
  describe('dataShareRequest', () => {
    it('throws an error if the user is requesting their own company', async () => {
      const args = { targetCompanyId: 'test' };
      const mockContext = {
        user: {
          companyId: args.targetCompanyId,
        },
      } as IContext;
      const service = ({
        create: jest.fn(),
      } as unknown) as CompanyPrivacyService;
      const controller = new CompanyPrivacyController(service);
      expect(controller.dataShareRequest(args, mockContext)).rejects.toThrow(
        CANNOT_REQUEST_YOUR_COMPANY
      );
    });
    it('throws an if the service throws an error', async () => {
      const args = { targetCompanyId: 'test' };
      const mockContext = {
        user: {
          companyId: 'company-id',
        },
      } as IContext;
      const error = 'error message';
      const service = ({
        sendDataShareRequest: jest.fn().mockRejectedValue(new Error(error)),
      } as unknown) as CompanyPrivacyService;
      const controller = new CompanyPrivacyController(service);
      expect(controller.dataShareRequest(args, mockContext)).rejects.toThrow(
        error
      );
    });
  });
});
