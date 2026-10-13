import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import {
  RUNTIME_ENVIRONMENTS,
  RuntimeEnvironment,
} from '@infrastructure/config/enums/runtime-environment';
import { isProductionGradePassword } from '@infrastructure/config/validators/is-production-grade-password';
import { RequiredInProduction } from '@infrastructure/config/validators/required-in-production.validator';

export class DatabaseEnvironment {
  @IsIn(RUNTIME_ENVIRONMENTS)
  readonly NODE_ENV: RuntimeEnvironment = RuntimeEnvironment.DEVELOPMENT;

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
  @RequiredInProduction(
    'DB_PASSWORD must be at least 16 characters and not a default password in production',
    isProductionGradePassword,
  )
  readonly DB_PASSWORD!: string;

  @Type(() => String)
  @Transform(({ value }: TransformFnParams): boolean => value === 'true')
  @IsBoolean()
  @RequiredInProduction('DB_SSL must be enabled in production', (value) => value === true)
  readonly DB_SSL: boolean = false;

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
