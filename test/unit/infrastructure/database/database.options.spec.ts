import { plainToInstance } from 'class-transformer';
import { DatabaseEnvironment } from '@infrastructure/config/schemas/database-environment.schema';
import { databaseOptions } from '@infrastructure/database/options/database.options';

function optionsFor(
  overrides: Readonly<Record<string, string>>,
): ReturnType<typeof databaseOptions> {
  const environment = plainToInstance(
    DatabaseEnvironment,
    { DB_HOST: 'db', DB_USERNAME: 'app', DB_PASSWORD: 'secret', DB_DATABASE: 'shop', ...overrides },
    { enableImplicitConversion: true },
  );
  return databaseOptions(environment);
}

describe('databaseOptions', () => {
  it('never synchronizes the schema or installs extensions at runtime', () => {
    expect(optionsFor({})).toMatchObject({
      synchronize: false,
      migrationsRun: false,
      installExtensions: false,
    });
  });

  it('bounds the pool and every wait on the database', () => {
    expect(
      optionsFor({
        DB_POOL_MAX: '20',
        DB_CONNECTION_TIMEOUT_MS: '1500',
        DB_STATEMENT_TIMEOUT_MS: '4000',
        DB_LOCK_TIMEOUT_MS: '1000',
      }).extra,
    ).toMatchObject({
      max: 20,
      connectionTimeoutMillis: 1500,
      statement_timeout: 4000,
      lock_timeout: 1000,
    });
  });

  it('verifies the server certificate when TLS is enabled', () => {
    expect(optionsFor({ DB_SSL: 'true' }).ssl).toEqual({ rejectUnauthorized: true });
  });

  it('connects without TLS only when it is disabled', () => {
    expect(optionsFor({ DB_SSL: 'false' }).ssl).toBe(false);
  });
});
