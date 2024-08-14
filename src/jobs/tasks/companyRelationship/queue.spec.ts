import {
  COMPANY_RELATIONSHIP_CREATED,
  DEFAULT_ATTEMPTS,
  DEFAULT_TIMEOUT,
} from '../../../constants/queue';
import { CompanyRelationshipEntity } from '../../../entities/CompanyRelationship';
import { CompanyRelationshipType } from '../../../types';
import { companyRelationshipQueue } from '../../queues';
import { addJobCompanyRelationshipCreatedToQueue } from './queue';

jest.mock('../../queues', () => ({
  companyRelationshipQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

describe('Company relationship queue', () => {
  describe('addJobCompanyRelationshipCreatedToQueue', () => {
    it('should add a company relationship created event to job queue', async () => {
      const companyRelationship = {
        id: 'some-id',
        customerId: 'customer-id',
        supplierId: 'supplier-id',
        inviteType: CompanyRelationshipType.Customer,
      } as CompanyRelationshipEntity;
      await addJobCompanyRelationshipCreatedToQueue(companyRelationship);

      expect(companyRelationshipQueue.add).toBeCalledTimes(1);
      expect(companyRelationshipQueue.add).toBeCalledWith(
        COMPANY_RELATIONSHIP_CREATED,
        companyRelationship,
        {
          jobId: expect.any(String),
          attempts: DEFAULT_ATTEMPTS,
          timeout: DEFAULT_TIMEOUT,
        }
      );
    });
  });
});
