import { QueueOptions } from 'bull';
import dotenv from 'dotenv';
import { CacheService } from '../../services/CacheService';
import { logger } from '../../utils/logger';

dotenv.config();

const client = CacheService();

client.redis.on('error', (error) => {
  logger.error(error, 'Redis client connection error');
});

const subscriber = CacheService();

subscriber.redis.on('error', (error) => {
  logger.error(error, 'Redis subscriber connection error:');
});

export const redisConnectionOptions: QueueOptions = {
  createClient: (type) => {
    switch (type) {
      case 'client':
        return client.redis;
      case 'subscriber':
        return subscriber.redis;
      default:
        return CacheService().redis;
    }
  },
};
