import dotenv from 'dotenv';
import env from 'env-var';

export enum Environment {
  LOCAL = 'local',
  TEST = 'test',
  DEV = 'dev',
  STAGING = 'staging',
  PREPROD = 'preprod',
  PROD = 'prod',
}

export const isEnvironmentLocal = (environment: string) =>
  environment === Environment.LOCAL;
export const isEnvironmentDevelopment = (environment: string) =>
  environment === Environment.DEV;
export const isEnvironmentStaging = (environment: string) =>
  environment === Environment.STAGING;
export const isEnvironmentPreprod = (environment: string) =>
  environment === Environment.PREPROD;
export const isEnvironmentProd = (environment: string) =>
  environment === Environment.PROD;

const isHubspotInviteEmailEnabled = (environment: string) =>
  isEnvironmentStaging(environment) || isEnvironmentProd(environment);
const isHubspotInviteStatusChangeEmailEnabled = (environment: string) =>
  isEnvironmentStaging(environment) || isEnvironmentProd(environment);
const isHubspotEmissionAllocationEmailEnabled = (environment: string) =>
  isEnvironmentStaging(environment) || isEnvironmentProd(environment);
const isHubspotInviteToJoinEmailEnabled = (environment: string) =>
  isEnvironmentStaging(environment) || isEnvironmentProd(environment);

export enum Flags {
  IS_HUBSPOT_INVITE_EMAIL_ENABLED = 'isHubspotInviteEmailEnabled', // Both customer and supplier
  IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED = 'isHubspotInviteStatusChangeEmailEnabled', // Approved, Declined, Invite again
  IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED = 'isHubspotEmissionAllocationEmailEnabled', // Data requested, sent, accepted, rejected, updated, deleted
  IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED = 'isHubspotInviteToJoinEmailEnabled', // Unable to invite, registration unsuccessful, declined
}

export const LaunchDarklyFlags = {
  HUBSPOT_CRM_ENABLED: 'hubspot-crm-enabled',
  IS_HUBSPOT_INVITE_TO_JOIN_WORKFLOW_ENABLED:
    'is-invite-to-join-hubspot-workflow-enabled',
};

interface JwtConfig {
  xyzIssuer: string;
  inviteSigningSecret: string;
  tribeSigningSecret: string;
}

interface RedisConfig {
  password: string;
  host: string;
  port: string;
  tlsEnabled: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
  enableOfflineQueue: boolean;
}

interface LoggingConfig {
  enableDetailedRequestLogging: boolean;
  writeLogsToFile: boolean;
}

interface AzureConfig {
  storageConnectionString: string;
}
interface SAndPConfig {
  token: string;
}

interface SlackConfig {
  token: string;
  channels: Record<string, string>;
  silence: boolean;
}

interface DnbConfig {
  key: string;
  secret: string;
}

interface AppConfig {
  launchDarklySdkKey: string;
  nodeEnv: string;
  environment: Environment;
  logging: LoggingConfig;
  integrationTestDropSchema: boolean;
  logLevel: string;
  logSubscriberRegistration: boolean;
  hubspotEmailToken: string;
  hubspotCrmToken: string;
  dnb: DnbConfig;
  webAppBaseUrl: string;
  flags: Record<Flags, boolean>;
  jwt: JwtConfig;
  redis: RedisConfig;
  azure: AzureConfig;
  sAndP: SAndPConfig;
  slack: SlackConfig;
  batchCompanyUploadJWTToken?: string;
}

let config: AppConfig;

const STRING_FALSE = '0';

export const getConfig = () => {
  if (config) {
    return config;
  }

  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    dotenv.config({ path: `${__dirname}/../.env` });
  } else if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: `${__dirname}/../.env.test` });
  }

  const environment = (env.get('ENVIRONMENT').asString() as Environment) || '';

  config = {
    launchDarklySdkKey: env
      .get('LAUNCH_DARKLY_SERVER_SDK_KEY')
      .default('sample-key')
      .asString(),
    nodeEnv: env.get('NODE_ENV').default('development').asString(),
    environment,
    logging: {
      enableDetailedRequestLogging: env
        .get('DETAILED_REQUEST_LOGGING_ENABLED')
        .default(STRING_FALSE)
        .asBool(),
      writeLogsToFile: env
        .get('WRITE_LOGS_TO_FILE')
        .default(STRING_FALSE)
        .asBool(),
    },
    integrationTestDropSchema: env
      .get('INTEGRATION_TEST_DROP_SCHEMA')
      .default(STRING_FALSE)
      .asBool(),
    logLevel: env.get('LOG_LEVEL').default('info').required().asString(),
    logSubscriberRegistration: env
      .get('LOG_SUBSCRIBER_REGISTRATION')
      .default('1')
      .asBool(),
    hubspotEmailToken: env.get('HUBSPOT_EMAIL_TOKEN').required().asString(),
    hubspotCrmToken: env.get('HUBSPOT_CRM_TOKEN').required().asString(),
    webAppBaseUrl: env
      .get('WEB_APP_BASE_URL')
      .default('http://localhost:3000')
      .required()
      .asString(),
    dnb: {
      key: env.get('DNB_API_KEY').required().asString(),
      secret: env.get('DNB_API_SECRET').required().asString(),
    },
    flags: {
      [Flags.IS_HUBSPOT_INVITE_EMAIL_ENABLED]: isHubspotInviteEmailEnabled(
        environment
      ),
      [Flags.IS_HUBSPOT_INVITE_STATUS_CHANGE_EMAIL_ENABLED]: isHubspotInviteStatusChangeEmailEnabled(
        environment
      ),
      [Flags.IS_HUBSPOT_EMISSION_ALLOCATION_EMAIL_ENABLED]: isHubspotEmissionAllocationEmailEnabled(
        environment
      ),
      [Flags.IS_HUBSPOT_INVITE_TO_JOIN_EMAIL_ENABLED]: isHubspotInviteToJoinEmailEnabled(
        environment
      ),
    },
    jwt: {
      xyzIssuer: env.get('JWT_ISSUER').required().asString(),
      inviteSigningSecret: env.get('INVITE_JWT_SECRET').required().asString(),
      tribeSigningSecret: env.get('TRIBE_JWT_SECRET').required().asString(),
    },
    redis: {
      password: env.get('REDIS_PASSWORD').required().asString(),
      host: env.get('REDIS_HOST').required().asString(),
      port: env.get('REDIS_PORT').required().asString(),
      tlsEnabled: process.env.NODE_ENV === 'production',
      rateLimitWindow: 1 * 60 * 1000, // 1 minute
      rateLimitMax: 10,
      enableOfflineQueue: false,
    },
    azure: {
      storageConnectionString: env
        .get('AZURE_STORAGE_CONNECTION_STRING')
        .required()
        .asString(),
    },
    sAndP: {
      token: env
        .get('S_AND_P_BASIC_AUTH_TOKEN_BASE_64_ENCODED')
        .required()
        .asString(),
    },
    slack: {
      token: env.get('SLACK_BOT_TOKEN').required().asString(),
      channels: {
        xyzAlerts: env
          .get('XYZ_ALERTS_SLACK_CHANNEL_ID')
          .required()
          .asString(),
      },
      silence: env.get('SILENCE_SLACK').default('0').asBool(),
    },
    batchCompanyUploadJWTToken: env
      .get('BATCH_COMPANY_UPLOAD_JWT_TOKEN')
      .asString(),
  };

  return config;
};

export const LAUNCH_DARKLY_GLOBAL_USER = 'global-flags';
