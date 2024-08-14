const env = require('env-var'); /* eslint-disable-line */

let rootDir;

if (process.env.NODE_ENV === 'test') {
  rootDir = `${__dirname}/src`;
} else if (process.env.NODE_ENV === 'production') {
  rootDir = `${__dirname}/build/src`;
} else {
  rootDir = `${__dirname}/src`;
}

const skipMigrations = env.get('SKIP_MIGRATIONS').asBool();

module.exports = {
  type: 'mssql',
  name: 'default',
  host: process.env.DBHOST,
  port: 1433,
  username: process.env.DBUSER,
  password: process.env.DBPASS,
  database: process.env.DBNAME,
  synchronize: false,
  requestTimeout: 15000,
  logging: false,
  logger: 'advanced-console',
  options: {
    encrypt: true,
    enableArithAbort: true,
  },
  subscribers: [`${rootDir}/subscribers/typeorm/!(*.integration.spec).{ts,js}`],
  entities: [`${rootDir}/entities/**/*.{ts,js}`],
  // runs migrations on server startup
  ...(skipMigrations
    ? { migrations: [], migrationsRun: false }
    : {
        migrations: [`${rootDir}/migrations/**/*.{ts,js}`],
        migrationsRun: true,
      }),
  migrationsTableName: 'app_migrations',
  cli: {
    migrationsDir: `${rootDir}/migrations`,
  },
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
};
