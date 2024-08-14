import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  ApolloServer,
  ApolloServerExpressConfig,
  gql,
} from 'apollo-server-express';
import fs from 'fs';
import depthLimit from 'graphql-depth-limit';
import { resolve } from 'path';
import { createContext } from './apolloContext';
import { getConfig } from './config';
import {
  applyDirectiveTransformers,
  directiveTransformers,
} from './directives';
import resolvers from './resolvers';
import {
  createNewRelicServerPlugin,
  errorCapturePlugin,
  requestLoggingPlugin,
} from './utils/apolloServerPlugins';
import { logger } from './utils/logger';

const getPlugins = () => {
  const basePlugins = [errorCapturePlugin(), createNewRelicServerPlugin()];
  const plugins = [...basePlugins];
  const {
    logging: { enableDetailedRequestLogging },
  } = getConfig();

  if (enableDetailedRequestLogging) {
    plugins.push(requestLoggingPlugin());
  }

  return plugins;
};

const buildApolloSchema = () => {
  const schemaBase = makeExecutableSchema({
    typeDefs: gql(fs.readFileSync(resolve('./schema.graphql'), 'utf-8')),
    resolvers,
  });

  return applyDirectiveTransformers(directiveTransformers, schemaBase);
};

export const getApolloConfig = (): ApolloServerExpressConfig => ({
  schema: buildApolloSchema(),
  context: createContext(),
  validationRules: [depthLimit(7)],
  logger,
  plugins: getPlugins(),
});

export const getApolloServer = () => new ApolloServer(getApolloConfig());
