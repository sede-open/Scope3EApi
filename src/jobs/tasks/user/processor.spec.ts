import {
  userCreatedProcessor,
  userUpdatedProcessor,
  userDeletedProcessor,
  hubspotContactCreatedProcessor,
} from './processor';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { Job } from 'bull';

jest.mock('../../../clients/HubspotCrmClient');

describe('userCreatedProcessor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('calls to create a contact in Hubspot', async () => {
    jest
      .spyOn(hubspotCrmClient, 'createContact')
      .mockResolvedValue({ id: 'some-id', properties: {} });
    const job = {
      data: { user: { id: 'user-id' }, inviter: { id: 'inviter-id' } },
    } as Job;
    await userCreatedProcessor(job);
    expect(hubspotCrmClient.createContact).toHaveBeenCalledWith(
      job.data.user,
      job.data.inviter
    );
  });
});

describe('userUpdatedProcessor', () => {
  it('calls to update a company in Hubspot', async () => {
    jest
      .spyOn(hubspotCrmClient, 'updateContact')
      .mockResolvedValue({ id: 'some-id', properties: {} });
    const job = {
      data: {
        updated: { id: 'user-id' },
      },
    } as Job;
    await userUpdatedProcessor(job);
    expect(hubspotCrmClient.updateContact).toHaveBeenCalledWith(
      job.data.updated
    );
  });
});

describe('userDeletedProcessor', () => {
  it('calls to update a company in Hubspot', async () => {
    jest.spyOn(hubspotCrmClient, 'deleteContact').mockResolvedValue(undefined);
    const job = {
      data: { id: 'user-id' },
    } as Job;
    await userDeletedProcessor(job);
    expect(hubspotCrmClient.deleteContact).toHaveBeenCalledWith(job.data);
  });
});

describe('hubspotContactCreatedProcessor', () => {
  it('calls to create the contact association with the company', async () => {
    const job = {
      data: { contact: { id: 'contact-id' }, companyId: 'company-id' },
    } as Job;
    jest
      .spyOn(hubspotCrmClient, 'associateContactWithCompany')
      .mockResolvedValue(job.data.contact);

    await hubspotContactCreatedProcessor(job);

    expect(hubspotCrmClient.associateContactWithCompany).toHaveBeenCalledWith({
      contact: job.data.contact,
      companyId: job.data.companyId,
    });
  });
});
