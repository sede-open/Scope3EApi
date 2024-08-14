import { Job } from 'bull';
import { UserEntity } from '../../../entities/User';
import { hubspotCrmClient } from '../../../clients/HubspotCrmClient';
import { HubspotObject } from '../../../clients/HubspotClient/types';

export const userCreatedProcessor = ({
  data,
}: Job<{ user: UserEntity; inviter?: UserEntity }>) => {
  return hubspotCrmClient.createContact(data.user, data.inviter);
};

export const userUpdatedProcessor = ({
  data,
}: Job<{
  prev?: Partial<UserEntity>;
  updated: UserEntity;
  updatedColumns?: Array<keyof UserEntity>;
}>) => {
  return hubspotCrmClient.updateContact(data.updated);
};

export const userDeletedProcessor = ({ data }: Job<UserEntity>) => {
  return hubspotCrmClient.deleteContact(data);
};

export const hubspotContactCreatedProcessor = ({
  data,
}: Job<{ contact: HubspotObject; companyId: string }>) => {
  return hubspotCrmClient.associateContactWithCompany(data);
};
