import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getConfig } from '../config';

import { CacheService } from '../services/CacheService';

const config = getConfig();
export const rateLimiterCache = CacheService({
  db: 1,
});

export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: rateLimiterCache.redis,
  }),
  windowMs: config.redis.rateLimitWindow,
  max: config.redis.rateLimitMax,
});
