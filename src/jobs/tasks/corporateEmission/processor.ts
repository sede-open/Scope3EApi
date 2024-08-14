import { Job } from 'bull';
import { CorporateEmissionEntity } from '../../../entities/CorporateEmission';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';

export const corporateEmissionCreatedProcessor = ({
  data,
}: Job<CorporateEmissionEntity>) => {
  return hubspotCrmClient.updateCompanyEmission(data);
};

export const corporateEmissionUpdatedProcessor = ({
  data,
}: Job<{
  prev: CorporateEmissionEntity;
  updated: CorporateEmissionEntity;
  updatedColumns: Array<keyof CorporateEmissionEntity>;
}>) => {
  return hubspotCrmClient.updateCompanyEmission(data.updated);
};

export const corporateEmissionDeletedProcessor = ({
  data,
}: Job<CorporateEmissionEntity>) => {
  return hubspotCrmClient.deleteLastYearEmission(data);
};
