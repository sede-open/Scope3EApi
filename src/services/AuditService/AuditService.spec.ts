import { v4 } from 'uuid';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { getAuditService } from '../../utils/apolloContext';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('Audit Service', () => {
  describe('objectUpdatesTracker()', () => {
    it('should return previous payload and current payload', () => {
      const auditService = getAuditService(
        (jest.fn() as unknown) as DatabaseService
      );
      const corporateEmission = createCorporateEmissionMock({
        id: v4(),
        companyId: v4(),
      });
      const { year, scope1 } = corporateEmission;
      const updatedEmission = { ...corporateEmission, year: 3030, scope1: 100 };
      const {
        previousPayload,
        currentPayload,
        updatedEntity,
      } = auditService.objectUpdatesTracker({
        originalObject: corporateEmission,
        updatedObject: updatedEmission,
      });
      expect(previousPayload).toEqual({
        year,
        scope1,
      });
      expect(currentPayload).toEqual({ year: 3030, scope1: 100 });
      expect(updatedEntity).toEqual(updatedEmission);
    });
  });
});
