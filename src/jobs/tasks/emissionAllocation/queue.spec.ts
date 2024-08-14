import {
  DEFAULT_ATTEMPTS,
  DEFAULT_TIMEOUT,
  EMISSION_ALLOCATION_CREATED,
} from '../../../constants/queue';
import { EmissionAllocationEntity } from '../../../entities/EmissionAllocation';
import { emissionAllocationQueue } from '../../queues';
import { addJobEmissionAllocationCreatedToQueue } from './queue';

jest.mock('../../queues', () => ({
  emissionAllocationQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

describe('Emission allocation queue', () => {
  describe('addJobEmissionAllocationCreated', () => {
    it('adds a emission allocation created job to the queue', async () => {
      const emissionAllocation = {
        id: 'allocation-id',
        supplierId: 'supplier-id',
        emissions: 1234,
      } as EmissionAllocationEntity;
      await addJobEmissionAllocationCreatedToQueue(emissionAllocation);
      expect(emissionAllocationQueue.add).toBeCalledTimes(1);
      expect(emissionAllocationQueue.add).toBeCalledWith(
        EMISSION_ALLOCATION_CREATED,
        emissionAllocation,
        {
          jobId: expect.any(String),
          attempts: DEFAULT_ATTEMPTS,
          timeout: DEFAULT_TIMEOUT,
        }
      );
    });
  });
});
