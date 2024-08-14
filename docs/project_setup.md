# Project Setup

## Dependencies

- Docker
- Node (v16.15.0)
- yarn

## Environment Variables

A copy of the environment variables is stored in `.env.example`. Some of the secrets in here have been removed. You can request these from someone else in the team, or pull them out of the [Azure Key Vault](https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults) secret if not othwerwise available.

```bash
cp .env.example .env
```

## Data stores

The application data stores are managed by [Docker](https://www.docker.com/). There are docker compose configurations for Intel and M1 macbooks. You can run the following command to start the containers:

### Intel Macs

```bash
docker-compose up --build
```

### M1 Macs

```bash
docker-compose -f docker-compose-m1.yml up
```

The reason for the M1 variant is due to the MSSQL server not currently being supported on apple silicon.

## Running the application

Next, install your dependencies, and then run your server:

```bash
yarn
```

The first time you run the server, a seed script will run, creating a user and a company for you.

Set `CURRENT_ABCD_USER=<Your example email>` in your `.env` file. This will be used to create a user with your email address.

```bash
yarn dev
```

### Dev Environment Configuration Options

The following environment variables are available for configuring the application in development:

| Name                             | Type                                                                                   | Description                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SKIP_MIGRATIONS                  | Boolean                                                                                | By default the database migrations are ran on server start. For a slight performance increase, you can disable this by setting `SKIP_MIGRATIONS=1`.                                      |
| INTEGRATION_TEST_DROP_SCHEMA     | Boolean                                                                                | By default the integration test suite will drop the schema and any development data when the integration tests are run. You can disable this by setting `INTEGRATION_TEST_DROP_SCHEMA=0` |
| DETAILED_REQUEST_LOGGING_ENABLED | Boolean                                                                                | Set this to true to enable more detailed server request logs.                                                                                                                            |
| LOG_LEVEL                        | String ([Log Level](https://getpino.io/#/docs/api?id=loggerlevel-string-gettersetter)) | Set your preferred Log Level, will only log data _above_ your given log threshold level                                                                                                  |
| WRITE_LOGS_TO_FILE               | Boolean                                                                                | Set to true to write the logs to files in `/logs` directory. The `info.log`, `warn.log`, `error.log` and `fatal.log` files collect the logs of the corresponding levels.                 |
| LOG_SUBSCRIBER_REGISTRATION      | Boolean                                                                                | Set this to true to disable the log when subscribers are registered on server startup .                                                                                                  |
| SILENCE_SLACK                    | Boolean                                                                                | Set this to true to prevent slack messages being set from an environment.                                                                                                                |
