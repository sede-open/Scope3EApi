import retry from 'async-retry';
import * as Sentry from '@sentry/node';
import { createConnection, getConnectionOptions, getConnection } from 'typeorm';
import { logger } from './utils/logger';

export async function getOrCreateConnection() {
  try {
    logger.debug('Getting an existing DB connection');
    // check if an existing default connection exists
    return getConnection();
  } catch {
    // otherwise try to create a new connection
    try {
      logger.debug('Will attempt to create a new DB connection');
      const options = await getConnectionOptions();
      return createConnection(options);
    } catch (e) {
      console.error('Failed to create a new DB connection: ', e);
      Sentry.captureException(e);
      throw e;
    }
  }
}

export const getOrCreateDBConnection = async () => {
  logger.debug('Will attempt to create a DB connection');

  try {
    const connection = await retry(
      async () => {
        const conn = await getOrCreateConnection();
        if (!conn) {
          throw new Error('Unable to create database connection');
        }
        if (!conn.isConnected) {
          await conn.connect();
          throw new Error('Unable to establish connection to database');
        }
        return conn;
      },
      {
        retries: 10,
        minTimeout: 1000,
      }
    );
    logger.debug('DB connection successfully created');
    return connection;
  } catch (e) {
    Sentry.captureException(e);
    throw e;
  }
};
