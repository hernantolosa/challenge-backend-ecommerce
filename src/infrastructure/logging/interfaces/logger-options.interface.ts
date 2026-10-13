import { type LogLevel } from '../enums/log-level';

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly service: string;
  readonly environment: string;
}
