import { Job } from 'bull';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { CompanyRelationshipEntity } from '../../../entities/CompanyRelationship';

export const companyRelationshipCreatedProcessor = ({
  data,
}: Job<CompanyRelationshipEntity>) => {
  return hubspotCrmClient.updateFirstInvitation(data);
};
