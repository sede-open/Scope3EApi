import {
  corporateEmissionCreatedProcessor,
  corporateEmissionDeletedProcessor,
  corporateEmissionUpdatedProcessor,
} from './processor';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { Job } from 'bull';

jest.mock('../../../clients/HubspotCrmClient');

describe('Corporate Emission processors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('corporateEmissionCreatedProcessor', () => {
    it('calls to update the company in Hubspot CRM', async () => {
      jest
        .spyOn(hubspotCrmClient, 'updateCompanyEmission')
        .mockResolvedValue({ id: 'some-id', properties: {} });
      const job = {
        data: { id: 'emission-id' },
      } as Job;
      await corporateEmissionCreatedProcessor(job);
      expect(hubspotCrmClient.updateCompanyEmission).toHaveBeenCalledWith(
        job.data
      );
    });
  });

  describe('corporateEmissionUpdatedProcessor', () => {
    it('calls to update the company in Hubspot CRM', async () => {
      jest
        .spyOn(hubspotCrmClient, 'updateCompanyEmission')
        .mockResolvedValue({ id: 'some-id', properties: {} });
      const job = {
        data: {
          updated: { id: 'emission-id' },
        },
      } as Job;
      await corporateEmissionUpdatedProcessor(job);
      expect(hubspotCrmClient.updateCompanyEmission).toHaveBeenCalledWith(
        job.data.updated
      );
    });
  });

  describe('corporateEmissionDeletedProcessor', () => {
    it('calls to update the company in Hubspot CRM', async () => {
      jest
        .spyOn(hubspotCrmClient, 'updateCompanyEmission')
        .mockResolvedValue({ id: 'some-id', properties: {} });
      const job = {
        data: { id: 'emission-id' },
      } as Job;
      await corporateEmissionDeletedProcessor(job);
      expect(hubspotCrmClient.deleteLastYearEmission).toHaveBeenCalledWith(
        job.data
      );
    });
  });
});
