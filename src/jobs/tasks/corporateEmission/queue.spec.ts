import {
  CORPORATE_EMISSION_CREATED,
  CORPORATE_EMISSION_DELETED,
  CORPORATE_EMISSION_UPDATED,
  DEFAULT_ATTEMPTS,
  DEFAULT_TIMEOUT,
} from '../../../constants/queue';
import { CorporateEmissionEntity } from '../../../entities/CorporateEmission';
import { corporateEmissionQueue } from '../../queues';
import {
  addJobCorporateEmissionCreatedToQueue,
  addJobCorporateEmissionDeletedToQueue,
  addJobCorporateEmissionUpdatedToQueue,
} from './queue';

jest.mock('../../queues', () => ({
  corporateEmissionQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

describe('corporateEmissionQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should add corporate emission created event to job queue', async () => {
    const corporateEmission = {
      id: 'some-emission-id',
    } as CorporateEmissionEntity;
    await addJobCorporateEmissionCreatedToQueue(corporateEmission);

    expect(corporateEmissionQueue.add).toHaveBeenCalledTimes(1);
    expect(corporateEmissionQueue.add).toHaveBeenCalledWith(
      CORPORATE_EMISSION_CREATED,
      corporateEmission,
      {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      }
    );
  });
  it('should add corporate emission updated event to job queue', async () => {
    const data = {
      prev: { scope1: 23 } as CorporateEmissionEntity,
      updated: { id: 'some-emission-id', scope1: 1 } as CorporateEmissionEntity,
      updatedColumns: ['scope1'] as Array<keyof CorporateEmissionEntity>,
    };
    await addJobCorporateEmissionUpdatedToQueue(data);

    expect(corporateEmissionQueue.add).toHaveBeenCalledTimes(1);
    expect(corporateEmissionQueue.add).toHaveBeenCalledWith(
      CORPORATE_EMISSION_UPDATED,
      data,
      {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      }
    );
  });
  it('should add corporate emission deleted event to job queue', async () => {
    const corporateEmission = {
      id: 'some-emission-id',
      scope1: 1,
    } as CorporateEmissionEntity;
    await addJobCorporateEmissionDeletedToQueue(corporateEmission);

    expect(corporateEmissionQueue.add).toHaveBeenCalledTimes(1);
    expect(corporateEmissionQueue.add).toHaveBeenCalledWith(
      CORPORATE_EMISSION_DELETED,
      corporateEmission,
      {
        jobId: expect.any(String),
        attempts: DEFAULT_ATTEMPTS,
        timeout: DEFAULT_TIMEOUT,
      }
    );
  });
});
