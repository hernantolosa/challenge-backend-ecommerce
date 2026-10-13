import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min, MinLength } from 'class-validator';
import { type LevelWithSilent } from 'pino';
import { DatabaseEnvironment } from './database-environment';

const LOG_LEVELS: readonly LevelWithSilent[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
];

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
