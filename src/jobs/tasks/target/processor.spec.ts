import {
  targetCreatedProcessor,
  targetUpdatedProcessor,
  targetDeletedProcessor,
} from './processor';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { Job } from 'bull';

jest.mock('../../../clients/HubspotCrmClient');

describe('Target processors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('targetCreatedProcessor', () => {
    it('calls to update the company in Hubspot CRM', async () => {
      const job = {
        data: { id: 'target-id' },
      } as Job;
      await targetCreatedProcessor(job);
      expect(hubspotCrmClient.updateCompanyTarget).toHaveBeenCalledWith(
        job.data
      );
    });
  });

  describe('targetUpdatedProcessor', () => {
    it('calls to update the company in Hubspot CRM', async () => {
      const job = {
        data: {
          updated: { id: 'target-id' },
        },
      } as Job;
      await targetUpdatedProcessor(job);
      expect(hubspotCrmClient.updateCompanyTarget).toHaveBeenCalledWith(
        job.data.updated
      );
    });
  });

  describe('targetDeletedProcessor', () => {
    it('calls to delete the company in Hubspot CRM', async () => {
      const job = {
        data: { id: 'emission-id' },
      } as Job;
      await targetDeletedProcessor(job);
      expect(hubspotCrmClient.deleteCompanyTarget).toHaveBeenCalledWith(
        job.data
      );
    });
  });
});
