import {
  COMPANY_CREATED,
  COMPANY_UPDATED,
  DEFAULT_ATTEMPTS,
  DEFAULT_TIMEOUT,
} from '../../../constants/queue';
import { CompanyEntity } from '../../../entities/Company';
import { CompanyStatus } from '../../../types';
import { companyQueue } from '../../queues';
import {
  addJobCompanyCreatedToQueue,
  addJobCompanyUpdatedToQueue,
} from './queue';

jest.mock('../../queues', () => ({
  companyQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

describe('Company Queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('addJobCompanyCreatedToQueue', () => {
    it('should add company created event to job queue', async () => {
      const company = { id: 'some-company-id' } as CompanyEntity;
      await addJobCompanyCreatedToQueue(company);

      expect(companyQueue.add).toHaveBeenCalledTimes(1);
      expect(companyQueue.add).toHaveBeenCalledWith(COMPANY_CREATED, company, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });

  describe('addJobCompanyUpdatedToQueue', () => {
    it('calls to add company updated event to job queue', async () => {
      const data = {
        prev: { status: CompanyStatus.Active } as CompanyEntity,
        updated: { id: 'some-company-id' } as CompanyEntity,
        updatedColumns: ['status'] as Array<keyof CompanyEntity>,
      };

      await addJobCompanyUpdatedToQueue(data);

      expect(companyQueue.add).toHaveBeenCalledTimes(1);
      expect(companyQueue.add).toHaveBeenCalledWith(COMPANY_UPDATED, data, {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      });
    });
  });
});
