import * as Sentry from '@sentry/node';
import { GraphQLRequestContext, PluginDefinition } from 'apollo-server-core';
import {
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestContextDidEncounterErrors,
} from 'apollo-server-plugin-base';
import createApolloServerPlugin from '@newrelic/apollo-server-plugin';
import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';

import { logger } from './logger';

export const requestLoggingPlugin: () => PluginDefinition = () => ({
  async requestDidStart(requestContext: GraphQLRequestContext<ExpressContext>) {
    return {
      async willSendResponse(
        responseContext: GraphQLRequestContextWillSendResponse<ExpressContext>
      ) {
        if (requestContext.request.operationName === 'IntrospectionQuery') {
          return;
        }

        const logLevel = responseContext.response.errors?.length
          ? 'error'
          : 'info';

        logger[logLevel]({
          operation: requestContext.request.operationName,
          variables: requestContext.request.variables,
          errors: `${responseContext.response.errors?.join('\n')}`,
        });
      },
    };
  },
});

export const errorCapturePlugin: () => PluginDefinition = () => ({
  async requestDidStart() {
    return {
      async didEncounterErrors(
        ctx: GraphQLRequestContextDidEncounterErrors<ExpressContext>
      ) {
        // If we couldn't parse the operation, don't
        // do anything here
        if (!ctx.operation) {
          return;
        }

        for (const err of ctx.errors) {
          Sentry.withScope((scope) => {
            const operationName = ctx?.operation?.operation ?? '';
            scope.setTag('kind', operationName);

            if (err.path) {
              // We can also add the path as breadcrumb
              scope.addBreadcrumb({
                category: 'query-path',
                message: err.path.join(' > '),
                level: Sentry.Severity.Debug,
              });
            }

            // transaction id helps match opaque client errors
            // x-transaction-id should match the client error
            const transactionId = ctx?.request?.http?.headers.get(
              'x-transaction-id'
            );
            if (transactionId) {
              scope.setTransactionName(transactionId);
            }

            Sentry.captureException(err);
          });
        }
      },
    };
  },
});

export const createNewRelicServerPlugin = () =>
  createApolloServerPlugin({
    captureScalars: true,
    captureIntrospectionQueries: false,
    captureServiceDefinitionQueries: false,
    captureHealthCheckQueries: false,
  });
