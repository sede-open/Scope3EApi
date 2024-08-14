import 'reflect-metadata';
import 'newrelic';

import * as Sentry from '@sentry/node';
import express from 'express';
import cookieParser from 'cookie-parser';

import helmet from 'helmet';

import { getOrCreateDBConnection } from './dbConnection';
import { getApolloServer } from './apollo';
import { router as filesRouter } from './routes/files';
import { router as publicRouter } from './routes/public';
import { router as tribeRouter } from './routes/tribe';
import { UserEntity } from './entities/User';
import { logger } from './utils/logger';
import { getCorsOptions } from './utils/cors';
import { LaunchDarklyClient } from './clients/LaunchDarklyClient';

declare module 'express' {
  interface Request {
    user?: UserEntity;
  }
}

export const startServer = async () => {
  const apolloServer = getApolloServer();

  await apolloServer.start();

  Sentry.init({
    enabled: process.env.NODE_ENV === 'production',
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT ?? 'local',
  });

  await getOrCreateDBConnection();
  await LaunchDarklyClient.getInstance();

  const app = express();

  // Setup middleware
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'development' ? false : undefined,
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // non-graphql routes
  app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/files', filesRouter);
  app.use('/public', publicRouter);
  app.use('/tribe', tribeRouter);

  apolloServer.applyMiddleware({
    app,
    cors: getCorsOptions(),
  });

  const port = 4000;
  const server = app.listen({ port }, () => {
    logger.info(`🌱 Server ready at localhost://${port}`);
    require('./jobs/queues/process');
  });

  server.on('close', async () => {
    if (LaunchDarklyClient.hasInstance()) {
      const client = (await LaunchDarklyClient.getInstance()).getClient();
      client.close();
    }
  });

  return server;
};
