import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Environment } from '@infrastructure/config/schemas/environment.schema';

const VALID_ENVIRONMENT: Readonly<Record<string, string>> = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'app',
  DB_PASSWORD: 'app-password',
  DB_DATABASE: 'ecommerce',
  JWT_SECRET: 'Tq7vX2mR9pL4wK8zN3bH6cJ1fG5dS0aYeUiOoPlMnBvCxZ',
  JWT_ISSUER: 'https://auth.example.com',
  JWT_AUDIENCE: 'ecommerce-api',
};

function invalidKeysOf(overrides: Readonly<Record<string, string>>): string[] {
  const environment = plainToInstance(
    Environment,
    { ...VALID_ENVIRONMENT, ...overrides },
    { enableImplicitConversion: true },
  );
  return validateSync(environment).map((error) => error.property);
}

describe('Environment', () => {
  it('accepts a complete configuration', () => {
    expect(invalidKeysOf({})).toEqual([]);
  });

  it.each([
    ['too short', 'Tq7vX2mR9pL4wK8zN3bH6cJ1fG5dS0a'],
    ['low diversity', 'a'.repeat(64)],
    ['a repeated phrase', 'secretsecretsecretsecretsecretsecretsecretsecret'],
  ])('rejects a %s JWT secret', (_case, secret) => {
    expect(invalidKeysOf({ JWT_SECRET: secret })).toEqual(['JWT_SECRET']);
  });

  it.each([
    ['LOG_LEVEL', 'verbose'],
    ['NODE_ENV', 'staging'],
    ['DB_POOL_MAX', '0'],
    ['TRUST_PROXY_HOPS', '-1'],
    ['JWT_MAX_AGE_SECONDS', '10'],
  ])('rejects an invalid %s', (key, value) => {
    expect(invalidKeysOf({ [key]: value })).toEqual([key]);
  });
});
