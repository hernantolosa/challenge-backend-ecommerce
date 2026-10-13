import { type PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { CategoryOrmEntity, ProductOrmEntity, VariantOrmEntity } from '@catalog/catalog.entities';
import { type DatabaseEnvironment } from '@config/environment';
import { StockLevelOrmEntity, StockMovementOrmEntity } from '@stock/infrastructure/stock.entities';
import { MIGRATIONS } from './migrations';

export function databaseOptions(environment: DatabaseEnvironment): PostgresConnectionOptions {
  return {
    type: 'postgres',
    host: environment.DB_HOST,
    port: environment.DB_PORT,
    username: environment.DB_USERNAME,
    password: environment.DB_PASSWORD,
    database: environment.DB_DATABASE,
    entities: [
      CategoryOrmEntity,
      ProductOrmEntity,
      VariantOrmEntity,
      StockLevelOrmEntity,
      StockMovementOrmEntity,
    ],
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
      application_name: 'ecommerce-api',
    },
  };
}
