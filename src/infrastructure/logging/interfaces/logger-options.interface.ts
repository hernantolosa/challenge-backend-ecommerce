import { type LogLevel } from '@infrastructure/logging/enums/log-level';

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly service: string;
  readonly environment: string;
}
