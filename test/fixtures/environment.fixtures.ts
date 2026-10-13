export const VALID_ENVIRONMENT: Readonly<Record<string, string>> = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'app',
  DB_PASSWORD: 'app-password',
  DB_DATABASE: 'ecommerce',
  JWT_SECRET: 'Tq7vX2mR9pL4wK8zN3bH6cJ1fG5dS0aYeUiOoPlMnBvCxZ',
  JWT_ISSUER: 'https://auth.example.com',
  JWT_AUDIENCE: 'ecommerce-api',
};

export const HARDENED_PRODUCTION: Readonly<Record<string, string>> = {
  NODE_ENV: 'production',
  DB_SSL: 'true',
  DB_PASSWORD: 'N7q!vR2x$Lp9wZ4m',
};
