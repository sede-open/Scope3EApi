import { Job } from 'bull';
import { CompanyEntity } from '../../../entities/Company';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';

export const companyCreatedProcessor = ({ data }: Job<CompanyEntity>) => {
  return hubspotCrmClient.createCompany(data);
};

export const companyUpdatedProcessor = ({
  data,
}: Job<{
  prev?: Partial<CompanyEntity>;
  updated: CompanyEntity;
  updatedColumns?: Array<keyof CompanyEntity>;
}>) => {
  return hubspotCrmClient.updateCompany(data.updated);
};
