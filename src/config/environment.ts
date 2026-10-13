import { plainToInstance, type ClassConstructor } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import * as dotenv from 'dotenv';
import { type LevelWithSilent } from 'pino';

const LOG_LEVELS: readonly LevelWithSilent[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
];

export class DatabaseEnvironment {
  @IsIn(['development', 'test', 'production'])
  readonly NODE_ENV: string = 'development';

  @IsString()
  @IsNotEmpty()
  readonly DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  readonly DB_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  readonly DB_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  readonly DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  readonly DB_DATABASE!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  readonly DB_POOL_MAX: number = 10;

  @IsInt()
  @Min(100)
  readonly DB_CONNECTION_TIMEOUT_MS: number = 2_000;

  @IsInt()
  @Min(100)
  readonly DB_STATEMENT_TIMEOUT_MS: number = 5_000;

  @IsInt()
  @Min(100)
  readonly DB_LOCK_TIMEOUT_MS: number = 2_000;
}

export class Environment extends DatabaseEnvironment {
  @IsIn(LOG_LEVELS)
  readonly LOG_LEVEL: LevelWithSilent = 'info';

  @IsInt()
  @Min(1)
  @Max(65535)
  readonly PORT: number = 3000;

  @IsString()
  @MinLength(32)
  readonly JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  readonly JWT_ISSUER!: string;

  @IsString()
  @IsNotEmpty()
  readonly JWT_AUDIENCE!: string;

  @IsInt()
  @Min(1)
  readonly THROTTLE_LIMIT: number = 100;

  @IsInt()
  @Min(1000)
  readonly THROTTLE_TTL_MS: number = 60_000;
}

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
