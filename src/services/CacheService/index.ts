import Bluebird from 'bluebird';
import Redis, { RedisOptions, Redis as IRedis } from 'ioredis';
import { getConfig } from '../../config';
import { logger } from '../../utils/logger';

type IORedisExpiryMode =
  | 'EX'
  | 'PX'
  | 'EXAT'
  | 'PXAT'
  | 'NX'
  | 'XX'
  | 'KEEPTTL'
  | 'GET';

export interface ICacheService {
  redis: IRedis;
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(
    key: string,
    data: T,
    expiryMode?: IORedisExpiryMode,
    time?: number | string
  ) => Promise<void>;
  initialise: () => Promise<void>;
}

export const CacheService = (
  redisOptionsExtra: Partial<RedisOptions> = {}
): ICacheService => {
  const config = getConfig();

  const redisOptions: RedisOptions = {
    password: config.redis.password,
    host: config.redis.host,
    port: parseInt(config.redis.port),
    connectTimeout: 15000,
    enableOfflineQueue: config.redis.enableOfflineQueue,
    db: 2,
    ...redisOptionsExtra,
  };

  // TLS is only used with a remote server
  if (config.redis.tlsEnabled) {
    redisOptions.tls = {
      servername: config.redis.host,
    };
  }

  const redis = new Redis(redisOptions);

  redis.setMaxListeners(20);

  redis.on('error', (err) => {
    logger.error(err, err.message);
  });

  const get: ICacheService['get'] = async (key) => {
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  };

  const set: ICacheService['set'] = async (key, data, expiryMode, time) => {
    await redis.set(key, JSON.stringify({ data }), expiryMode, time);
  };

  const initialise = async () => {
    await new Bluebird(async (resolve, reject) => {
      if (redis.status === 'ready') {
        return resolve();
      }
      redis.once('ready', () => {
        return resolve();
      });

      redis.on('error', (err) => {
        logger.error(err, err.message);
        return reject();
      });
    });
  };

  return { redis, get, set, initialise };
};
