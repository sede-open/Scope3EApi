import { companyCreatedProcessor, companyUpdatedProcessor } from './processor';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { Job } from 'bull';

jest.mock('../../../clients/HubspotCrmClient');

describe('Company processors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('companyCreatedProcessor', () => {
    it('calls to create a company in Hubspot', async () => {
      jest
        .spyOn(hubspotCrmClient, 'createCompany')
        .mockResolvedValue({ id: 'some-id', properties: {} });
      const job = {
        data: { id: 'company-id' },
      } as Job;
      await companyCreatedProcessor(job);
      expect(hubspotCrmClient.createCompany).toHaveBeenCalledWith(job.data);
    });
  });

  describe('companyUpdatedProcessor', () => {
    it('calls to update a company in Hubspot', async () => {
      jest
        .spyOn(hubspotCrmClient, 'updateCompany')
        .mockResolvedValue({ id: 'some-id', properties: {} });
      const job = {
        data: {
          updated: { id: 'company-id' },
        },
      } as Job;
      await companyUpdatedProcessor(job);
      expect(hubspotCrmClient.updateCompany).toHaveBeenCalledWith(
        job.data.updated
      );
    });
  });
});
