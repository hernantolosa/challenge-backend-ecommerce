import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min, MinLength } from 'class-validator';
import { LOG_LEVELS, LogLevel } from '@infrastructure/logging/enums/log-level';
import { DatabaseEnvironment } from './database-environment.schema';

const RUNTIME_ENVIRONMENTS = ['development', 'test', 'production'];

export class Environment extends DatabaseEnvironment {
  @IsIn(RUNTIME_ENVIRONMENTS)
  readonly NODE_ENV: string = 'development';

  @IsIn(LOG_LEVELS)
  readonly LOG_LEVEL: LogLevel = LogLevel.INFO;

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

  @IsInt()
  @Min(0)
  @Max(10)
  readonly TRUST_PROXY_HOPS: number = 0;
}
