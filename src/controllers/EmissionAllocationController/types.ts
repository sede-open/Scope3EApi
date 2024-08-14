import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';

export type AllocationAuditPayloadType = Omit<
  EmissionAllocationEntity,
  | 'supplier'
  | 'customer'
  | 'supplierApprover'
  | 'customerApprover'
  | 'category'
  | 'customerEmission'
  | 'supplierEmission'
>;
