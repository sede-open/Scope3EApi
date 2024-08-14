import { CorporateEmissionAccessService } from '.';
import { CORPORATE_EMISSION_UPDATED_ACTION } from '../../constants/audit';
import { createCorporateEmissionAccessMock } from '../../mocks/emissionAccess';
import { AuditService } from '../AuditService';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('CorporateEmissionAccessService', () => {
  describe('upsert()', () => {
    it('should update entity and record audit', async () => {
      const auditService = ({
        createEntity: jest.fn(),
      } as unknown) as AuditService;
      const databaseService = ({
        getEntityManager: jest.fn(),
      } as unknown) as DatabaseService;
      const corporateEmissionAccessService = new CorporateEmissionAccessService(
        databaseService,
        auditService
      );
      const beforeEmissionAccess = createCorporateEmissionAccessMock({
        id: 'beforeID',
      });
      corporateEmissionAccessService.findOne = () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        beforeEmissionAccess as any;
      const upsert = jest.fn();
      upsert.mockImplementation((attrs) => {
        return attrs;
      });
      corporateEmissionAccessService.getRepository = () =>
        ({
          upsert,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      const emissionAccess = createCorporateEmissionAccessMock();
      await corporateEmissionAccessService.updateEmissionAccess(
        emissionAccess as any,
        'userId'
      );
      expect(upsert).toHaveBeenCalledWith(emissionAccess);
      expect(auditService.createEntity).toHaveBeenCalledWith(
        {
          userId: 'userId',
          action: CORPORATE_EMISSION_UPDATED_ACTION,
        },
        {
          id: emissionAccess.emissionId,
          corporateEmissionAccess: emissionAccess,
        },
        {
          id: emissionAccess.emissionId,
          corporateEmissionAccess: beforeEmissionAccess,
        }
      );
    });
  });
});
