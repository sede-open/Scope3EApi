FROM node:gallium-slim as build
WORKDIR /opt/app
COPY . /opt/app/
RUN yarn
RUN yarn build

FROM node:gallium-slim
WORKDIR /opt/app
COPY --from=build /opt/app/node_modules /opt/app/node_modules
COPY --from=build /opt/app/build /opt/app/build
COPY package.json ormconfig.js ormconfig.migrations.js schema.graphql newrelic.js /opt/app/
EXPOSE 4000
RUN groupadd appgroup && useradd -u 999 -G appgroup appuser
USER appuser
CMD yarn start
