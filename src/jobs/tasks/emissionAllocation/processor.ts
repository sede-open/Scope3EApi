import { Job } from 'bull';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { EmissionAllocationEntity } from '../../../entities/EmissionAllocation';

export const emissionAllocationCreatedProcessor = ({
  data,
}: Job<EmissionAllocationEntity>) => {
  return hubspotCrmClient.updateEmissionAllocation(data);
};
