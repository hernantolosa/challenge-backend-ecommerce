import { type PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { type DatabaseEnvironment } from '../../config/schemas/database-environment.schema';
import { ENTITIES } from '../entities';
import { MIGRATIONS } from '../migrations';

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
  };
}
