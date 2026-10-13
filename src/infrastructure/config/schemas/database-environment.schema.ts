import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class DatabaseEnvironment {
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
