import {
  basicLogger,
  init,
  LDClient,
  LDOptions,
  LDUser,
} from 'launchdarkly-node-server-sdk';
import { TestData } from 'launchdarkly-node-server-sdk/integrations';
import {
  getConfig,
  LaunchDarklyFlags,
  LAUNCH_DARKLY_GLOBAL_USER,
} from '../../config';
import { UserEntity } from '../../entities/User';
import { logger } from '../../utils/logger';
//import { RedisFeatureStore } from 'launchdarkly-node-server-sdk-redis';

export class LaunchDarklyClient {
  private static instance?: LaunchDarklyClient;
  private testData?: TestData;
  private client: LDClient;

  constructor(client: LDClient, testData?: TestData) {
    this.client = client;
    this.testData = testData;
  }

  static hasInstance() {
    return this.instance ? true : false;
  }

  static async getInstance(): Promise<LaunchDarklyClient> {
    if (this.instance) {
      return this.instance;
    }
    const td = await getTestData();

    const options: LDOptions = {
      // Suppresses logs in test environment as it fills stdout with 401 invalid sdk key error
      logger:
        getConfig().nodeEnv === 'test'
          ? basicLogger({ level: 'none' })
          : logger,
      timeout: 5,
      updateProcessor: td,
    };
    const { launchDarklySdkKey } = getConfig();
    const trimmedSdkKey = launchDarklySdkKey.trim();
    const client = init(trimmedSdkKey, options);
    this.instance = new LaunchDarklyClient(client, td);
    try {
      await client.waitForInitialization();
    } catch (err) {
      logger.error(
        err,
        'Connecting to Launch Darkly, Falling back to redis cache or defualt values'
      );
    }
    return this.instance;
  }

  getClient() {
    return this.client;
  }

  getTestData() {
    return this.testData as TestData;
  }
}

const getTestData = async () => {
  if (getConfig().nodeEnv === 'test') {
    const td = TestData();
    // set default flags here for jest tests
    await td.update(
      td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
    );
    return td;
  }
};

export const getFlag = async <T>(
  flagKey: string,
  defaultValue: T,
  userEntity?: UserEntity
): Promise<T> => {
  const ldClient = (await LaunchDarklyClient.getInstance()).getClient();
  const user = userEntity
    ? getLaunchDarklyUser(userEntity)
    : { key: LAUNCH_DARKLY_GLOBAL_USER, name: 'Global Flags' };
  return ldClient.variation(flagKey, user, defaultValue) as Promise<T>;
};

export const getLaunchDarklyUser = (user: UserEntity): LDUser => {
  return {
    key: user.email,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  };
};

export const getLDTestData = async () => {
  const instance = await LaunchDarklyClient.getInstance();
  if (instance) {
    return instance.getTestData();
  } else {
    throw new Error('Launch Darkly Test Instance Undefined');
  }
};

export const getSecureHash = async (user: LDUser) => {
  const ld = await LaunchDarklyClient.getInstance();
  const client = ld.getClient();
  return client.secureModeHash(user);
};
