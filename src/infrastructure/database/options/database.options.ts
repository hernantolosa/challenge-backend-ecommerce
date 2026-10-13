import { type PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { type DatabaseEnvironment } from '@infrastructure/config/schemas/database-environment.schema';
import { ENTITIES } from '@infrastructure/database/entities';
import { MIGRATIONS } from '@infrastructure/database/migrations';

const APPLICATION_NAME = 'ecommerce-api';

export function databaseOptions(environment: DatabaseEnvironment): PostgresConnectionOptions {
  return {
    type: 'postgres',
    host: environment.DB_HOST,
    port: environment.DB_PORT,
    username: environment.DB_USERNAME,
    password: environment.DB_PASSWORD,
    database: environment.DB_DATABASE,
    entities: ENTITIES,
    migrations: MIGRATIONS,
    synchronize: false,
    migrationsRun: false,
    uuidExtension: 'pgcrypto',
    installExtensions: false,
    extra: {
      max: environment.DB_POOL_MAX,
      connectionTimeoutMillis: environment.DB_CONNECTION_TIMEOUT_MS,
      statement_timeout: environment.DB_STATEMENT_TIMEOUT_MS,
      lock_timeout: environment.DB_LOCK_TIMEOUT_MS,
      application_name: APPLICATION_NAME,
    },
  };
}
