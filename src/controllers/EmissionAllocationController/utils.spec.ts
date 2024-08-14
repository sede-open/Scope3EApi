import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { emissionAllocationSentByMe } from '../../mocks/emissionAllocation';
import { EmissionAllocationStatus } from '../../types';
import { AllocationAuditPayloadType } from './types';
import { getCustomerScope3Adjustment } from './utils';

describe('EmissionAllocationController utils', () => {
  describe('getCustomerScope3Adjustment()', () => {
    describe('when customer changes their mind about adding allocation to scope 3 total', () => {
      it('should return negative emissions of previous allocation', () => {
        const previousAllocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: true,
        } as unknown) as AllocationAuditPayloadType;
        const allocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: false,
        } as unknown) as EmissionAllocationEntity;

        const result = getCustomerScope3Adjustment({
          previousAllocation,
          allocation,
        });

        expect(result).toBe(Number(previousAllocation.emissions) * -1);
      });
    });

    describe('customer accepts and adds allocation to their scope 3 total', () => {
      it('should return emissions of the new allocation', () => {
        const previousAllocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: false,
          status: EmissionAllocationStatus.AwaitingApproval,
        } as unknown) as AllocationAuditPayloadType;
        const allocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: true,
          emissions: 909090,
          status: EmissionAllocationStatus.Approved,
        } as unknown) as EmissionAllocationEntity;

        const result = getCustomerScope3Adjustment({
          previousAllocation,
          allocation,
        });

        expect(result).toBe(allocation.emissions);
      });
    });

    describe('supplier edits allocation forcing it into AwaitingApproval state', () => {
      it('should return negative emissions of previous allocation', () => {
        const previousAllocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: true,
          status: EmissionAllocationStatus.Approved,
        } as unknown) as AllocationAuditPayloadType;
        const allocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: true,
          emissions: 909090,
          status: EmissionAllocationStatus.AwaitingApproval,
        } as unknown) as EmissionAllocationEntity;

        const result = getCustomerScope3Adjustment({
          previousAllocation,
          allocation,
        });

        expect(result).toBe(Number(previousAllocation.emissions) * -1);
      });
    });

    describe('customer accepts after update has been made to allocation that was previously included in scope 3', () => {
      it('should return emissions of the new allocation', () => {
        const previousAllocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: true,
          status: EmissionAllocationStatus.AwaitingApproval,
        } as unknown) as AllocationAuditPayloadType;
        const allocation = ({
          ...emissionAllocationSentByMe,
          addedToCustomerScopeTotal: true,
          emissions: 909090,
          status: EmissionAllocationStatus.Approved,
        } as unknown) as EmissionAllocationEntity;

        const result = getCustomerScope3Adjustment({
          previousAllocation,
          allocation,
        });

        expect(result).toBe(allocation.emissions);
      });
    });
  });
});
