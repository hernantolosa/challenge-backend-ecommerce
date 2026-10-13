import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { IsStrongSecret } from '@infrastructure/config/validators/is-strong-secret.validator';
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

  @IsStrongSecret()
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

  @IsInt()
  @Min(60)
  @Max(86_400)
  readonly JWT_MAX_AGE_SECONDS: number = 3_600;
}
