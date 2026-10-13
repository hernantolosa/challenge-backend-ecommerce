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

  describe('database TLS flag', () => {
    it.each([
      ['false', false],
      ['true', true],
    ])('reads DB_SSL=%p as %p instead of treating every string as true', (raw, expected) => {
      const environment = plainToInstance(
        Environment,
        { ...VALID_ENVIRONMENT, DB_SSL: raw },
        { enableImplicitConversion: true },
      );

      expect(environment.DB_SSL).toBe(expected);
    });
  });

  describe('in production', () => {
    const PRODUCTION: Readonly<Record<string, string>> = {
      NODE_ENV: 'production',
      DB_SSL: 'true',
      DB_PASSWORD: 'N7q!vR2x$Lp9wZ4m',
    };

    it('accepts a hardened configuration', () => {
      expect(invalidKeysOf(PRODUCTION)).toEqual([]);
    });

    it('requires TLS to the database', () => {
      expect(invalidKeysOf({ ...PRODUCTION, DB_SSL: 'false' })).toEqual(['DB_SSL']);
    });

    it.each([['postgres'], ['PASSWORD'], ['short-pass']])(
      'rejects the database password %p',
      (password) => {
        expect(invalidKeysOf({ ...PRODUCTION, DB_PASSWORD: password })).toEqual(['DB_PASSWORD']);
      },
    );

    it('keeps local defaults usable outside production', () => {
      expect(invalidKeysOf({ DB_PASSWORD: 'postgres', DB_SSL: 'false' })).toEqual([]);
    });
  });
});
