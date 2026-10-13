const TEST_ENVIRONMENT: Readonly<Record<string, string>> = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_DATABASE: 'ecommerce_challenge_test',
  JWT_SECRET: 'Tq7vX2mR9pL4wK8zN3bH6cJ1fG5dS0aYeUiOoPlMnBvCxZ',
  JWT_ISSUER: 'https://auth.test.local',
  JWT_AUDIENCE: 'ecommerce-api-test',
  THROTTLE_LIMIT: '10000',
  THROTTLE_TTL_MS: '60000',
};

Object.assign(process.env, TEST_ENVIRONMENT);
