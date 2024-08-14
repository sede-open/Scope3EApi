import { emissionAllocationCreatedProcessor } from './processor';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { Job } from 'bull';
import { HubspotObject } from '../../../clients/HubspotClient/types';

jest.mock('../../../clients/HubspotCrmClient');

describe('Emission allocation processors', () => {
  describe('emissionAllocationCreatedProcessor', () => {
    it('calls to update the company emission allocation in HubSpot', () => {
      jest
        .spyOn(hubspotCrmClient, 'updateEmissionAllocation')
        .mockResolvedValueOnce({} as HubspotObject);
      const job = {
        data: {
          id: '123',
          supplierId: 'supplier-id',
          emissions: 1245,
        },
      } as Job;
      emissionAllocationCreatedProcessor(job);
      expect(hubspotCrmClient.updateEmissionAllocation).toBeCalledWith(
        job.data
      );
    });
  });
});
