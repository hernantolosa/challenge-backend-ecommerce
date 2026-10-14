import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { VALID_ENVIRONMENT } from '@test/fixtures/environment.fixtures';
import { Environment } from '@config/environment.schema';

function invalidKeysIn(variables: Readonly<Record<string, string>>): string[] {
  const environment = plainToInstance(Environment, variables, { enableImplicitConversion: true });
  return validateSync(environment).map((error) => error.property);
}

function invalidKeysOf(overrides: Readonly<Record<string, string>>): string[] {
  return invalidKeysIn({ ...VALID_ENVIRONMENT, ...overrides });
}

describe('Environment', () => {
  it('accepts a complete configuration', () => {
    expect(invalidKeysOf({})).toEqual([]);
  });

  it('requires NODE_ENV instead of assuming development', () => {
    const { NODE_ENV: _omitted, ...withoutNodeEnv } = VALID_ENVIRONMENT;

    expect(invalidKeysIn(withoutNodeEnv)).toEqual(['NODE_ENV']);
  });

  it('rejects a JWT secret shorter than 32 characters', () => {
    expect(invalidKeysOf({ JWT_SECRET: 'too-short' })).toEqual(['JWT_SECRET']);
  });

  it.each([
    ['LOG_LEVEL', 'verbose'],
    ['NODE_ENV', 'staging'],
    ['DB_POOL_MAX', '0'],
  ])('rejects an invalid %s', (key, value) => {
    expect(invalidKeysOf({ [key]: value })).toEqual([key]);
  });
});
