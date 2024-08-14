import { companyRelationshipCreatedProcessor } from './processor';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { Job } from 'bull';
import { CompanyRelationshipType } from '../../../types';
import { HubspotObject } from '../../../clients/HubspotClient/types';

jest.mock('../../../clients/HubspotCrmClient');

describe('Company Relationship processors', () => {
  describe('companyRelationshipCreatedProcessor', () => {
    it('calls to update the company first invitation in HubSpot', () => {
      jest
        .spyOn(hubspotCrmClient, 'updateFirstInvitation')
        .mockResolvedValueOnce({} as HubspotObject);
      const job = {
        data: {
          id: '123',
          inviteType: CompanyRelationshipType.Customer,
          customerId: 'customer-id',
          supplierId: 'supplier-id',
        },
      } as Job;
      companyRelationshipCreatedProcessor(job);
      expect(hubspotCrmClient.updateFirstInvitation).toBeCalledWith(job.data);
    });
  });
});
