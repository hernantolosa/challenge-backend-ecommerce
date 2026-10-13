import { type Logger } from 'pino';
import { type LogLevel } from '../enums/log-level';
import { type LogFields } from '../types/log-fields.type';

export class AppLogger {
  constructor(private readonly logger: Logger) {}

  debug(message: string, fields: LogFields = {}): void {
    this.logger.debug(fields, message);
  }

  info(message: string, fields: LogFields = {}): void {
    this.logger.info(fields, message);
  }

  warn(message: string, fields: LogFields = {}): void {
    this.logger.warn(fields, message);
  }

  error(message: string, error: unknown, fields: LogFields = {}): void {
    this.logger.error({ ...fields, error: asError(error) }, message);
  }

  atLevel(level: LogLevel, message: string, fields: LogFields = {}): void {
    this.logger[level](fields, message);
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
