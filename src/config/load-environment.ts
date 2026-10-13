import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as dotenv from 'dotenv';
import { DatabaseEnvironment } from './database-environment.schema';
import { Environment } from './environment.schema';

export function loadEnvironment(): Environment {
  return loadAndValidate(Environment);
}

export function loadDatabaseEnvironment(): DatabaseEnvironment {
  return loadAndValidate(DatabaseEnvironment);
}

function loadAndValidate<T extends object>(schema: ClassConstructor<T>): T {
  dotenv.config({ quiet: true });
  const environment = plainToInstance(schema, process.env, { enableImplicitConversion: true });
  const invalidKeys = validateSync(environment).map((error) => error.property);

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid environment variables: ${invalidKeys.join(', ')}`);
  }

  return environment;
}
