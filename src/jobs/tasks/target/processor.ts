import { Job } from 'bull';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { TargetEntity } from '../../../entities/Target';

export const targetCreatedProcessor = ({ data }: Job<TargetEntity>) => {
  return hubspotCrmClient.updateCompanyTarget(data);
};

export const targetUpdatedProcessor = ({
  data,
}: Job<{
  prev?: TargetEntity;
  updated: TargetEntity;
  updatedColumns?: Array<keyof TargetEntity>;
}>) => {
  return hubspotCrmClient.updateCompanyTarget(data.updated);
};

export const targetDeletedProcessor = ({ data }: Job<TargetEntity>) => {
  return hubspotCrmClient.deleteCompanyTarget(data);
};
