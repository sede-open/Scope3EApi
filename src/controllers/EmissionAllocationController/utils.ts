import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import {
  CompanyRelationshipType,
  EmissionAllocation,
  EmissionAllocationStatus,
} from '../../types';
import { AllocationAuditPayloadType } from './types';

const VALID_ALLOCATION_STATUSES = {
  [CompanyRelationshipType.Customer]: {
    [EmissionAllocationStatus.Approved]: [EmissionAllocationStatus.Rejected],
    [EmissionAllocationStatus.AwaitingApproval]: [
      EmissionAllocationStatus.Approved,
      EmissionAllocationStatus.Rejected,
    ],
    [EmissionAllocationStatus.Rejected]: [EmissionAllocationStatus.Requested],
    [EmissionAllocationStatus.Requested]: [],
    [EmissionAllocationStatus.RequestDismissed]: [
      EmissionAllocationStatus.Requested,
    ],
  },
  [CompanyRelationshipType.Supplier]: {
    [EmissionAllocationStatus.Approved]: [
      EmissionAllocationStatus.AwaitingApproval,
    ],
    [EmissionAllocationStatus.AwaitingApproval]: [],
    [EmissionAllocationStatus.Rejected]: [
      EmissionAllocationStatus.AwaitingApproval,
    ],
    [EmissionAllocationStatus.Requested]: [
      EmissionAllocationStatus.AwaitingApproval,
      EmissionAllocationStatus.RequestDismissed,
    ],
    [EmissionAllocationStatus.RequestDismissed]: [
      EmissionAllocationStatus.AwaitingApproval,
    ],
  },
};

export const isValidAllocationStatusChange = (
  currentAllocationStatus: EmissionAllocationStatus,
  nextAllocationStatus: EmissionAllocationStatus,
  approverType: CompanyRelationshipType
) => {
  return !!VALID_ALLOCATION_STATUSES[approverType][
    currentAllocationStatus
  ].find((e) => e === nextAllocationStatus);
};

export const getCustomerScope3Adjustment = ({
  allocation,
  previousAllocation,
}: {
  allocation?: EmissionAllocationEntity | EmissionAllocation;
  previousAllocation: AllocationAuditPayloadType;
}): number | undefined => {
  // allocation has been deleted by the supplier
  if (
    !allocation &&
    previousAllocation.addedToCustomerScopeTotal &&
    previousAllocation.emissions
  ) {
    return previousAllocation.emissions * -1;
  } else if (!allocation) {
    return undefined;
  }

  // customer changes their mind about adding allocation to scope 3 total
  if (
    previousAllocation.addedToCustomerScopeTotal &&
    previousAllocation.emissions &&
    !allocation.addedToCustomerScopeTotal
  ) {
    return previousAllocation.emissions * -1;
  }

  // customer accepts and adds allocation to their scope 3 total
  if (
    !previousAllocation.addedToCustomerScopeTotal &&
    allocation.addedToCustomerScopeTotal &&
    allocation.status === EmissionAllocationStatus.Approved &&
    allocation.emissions
  ) {
    return allocation.emissions;
  }

  if (
    previousAllocation.addedToCustomerScopeTotal &&
    allocation.addedToCustomerScopeTotal
  ) {
    // supplier edits allocation forcing it into AwaitingApproval state
    if (
      previousAllocation.status === EmissionAllocationStatus.Approved &&
      allocation.status === EmissionAllocationStatus.AwaitingApproval &&
      previousAllocation.emissions
    ) {
      return previousAllocation.emissions * -1;
    }

    // customer rejects an already approved allocation
    if (
      previousAllocation.status === EmissionAllocationStatus.Approved &&
      allocation.status === EmissionAllocationStatus.Rejected &&
      previousAllocation.emissions
    ) {
      return previousAllocation.emissions * -1;
    }

    // customer accepts after update has been made to allocation
    // that was previously included in scope 3
    if (
      previousAllocation.status === EmissionAllocationStatus.AwaitingApproval &&
      allocation.status === EmissionAllocationStatus.Approved &&
      allocation.emissions
    ) {
      return allocation.emissions;
    }
  }
};
