import { AuditController } from './';
import { Repository } from 'typeorm';
import { AuditEntity } from '../../entities/Audit';
import { AuditActionType, USER_CREATED_ACTION } from '../../constants/audit';
import { IContext } from '../../apolloContext';

describe('AuditController', () => {
  describe('saveAuditTrail()', () => {
    it('should save audit trail with correct values', async () => {
      const insert = jest.fn();
      const auditRepositoryMock = ({
        insert,
      } as unknown) as Repository<AuditEntity>;

      const action = USER_CREATED_ACTION;
      const userId = '123344555555';

      const controller = new AuditController(auditRepositoryMock);
      await controller.saveAuditTrail(
        {
          userId,
          action,
        },
        (jest.fn() as unknown) as IContext
      );

      expect(insert).toBeCalledWith(
        expect.objectContaining({
          userId,
          action,
        })
      );
    });
  });

  describe('saveAuditTrails()', () => {
    it('should save audit trails with correct values', async () => {
      const insert = jest.fn();
      const auditRepositoryMock = ({
        insert,
      } as unknown) as Repository<AuditEntity>;

      const action = USER_CREATED_ACTION as AuditActionType;
      const userId = '123344555555';

      const auditTrails = [
        {
          userId,
          action,
        },
        {
          userId,
          action,
        },
      ];

      const controller = new AuditController(auditRepositoryMock);
      await controller.saveAuditTrails(
        { auditTrails },
        (jest.fn() as unknown) as IContext
      );

      expect(insert).toBeCalledWith(expect.objectContaining(auditTrails));
    });
  });
});
