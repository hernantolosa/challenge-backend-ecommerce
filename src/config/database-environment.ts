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
}
