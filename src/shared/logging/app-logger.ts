import { type LoggerService } from '@nestjs/common';
import { pino, type Logger } from 'pino';
import { type LogDestination } from './log-destination';
import { traceFieldsOf, type TraceContextStore } from './request-tracing';

export const LogLevel = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
  SILENT: 'silent',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export const LOG_LEVELS: readonly LogLevel[] = Object.values(LogLevel);

export type LogFields = Readonly<Record<string, unknown>>;

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly service: string;
  readonly environment: string;
}

interface SerializedError {
  readonly type: string;
  readonly message: string;
  readonly stack: string | null;
  readonly code: string | null;
}

const SENSITIVE_PATHS = [
  'authorization',
  'password',
  'secret',
  'token',
  '*.authorization',
  '*.password',
  '*.secret',
  '*.token',
];
const BOOTSTRAP_CONTEXTS: ReadonlySet<string> = new Set([
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'NestFactory',
  'NestApplication',
]);

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
    this.logger.error(
      { ...fields, error: error instanceof Error ? error : new Error(String(error)) },
      message,
    );
  }

  atLevel(level: LogLevel, message: string, fields: LogFields = {}): void {
    this.logger[level](fields, message);
  }
}

export class NestLoggerAdapter implements LoggerService {
  constructor(private readonly logger: AppLogger) {}

  log(message: unknown, ...params: unknown[]): void {
    const context = contextOf(params);
    const level = BOOTSTRAP_CONTEXTS.has(context) ? LogLevel.DEBUG : LogLevel.INFO;
    this.logger.atLevel(level, String(message), { context });
  }

  error(message: unknown, ...params: unknown[]): void {
    this.logger.error(String(message), params.at(0), { context: contextOf(params) });
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.logger.warn(String(message), { context: contextOf(params) });
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.logger.debug(String(message), { context: contextOf(params) });
  }

  verbose(message: unknown, ...params: unknown[]): void {
    this.logger.debug(String(message), { context: contextOf(params) });
  }
}

export function createPinoLogger(
  options: LoggerOptions,
  destination: LogDestination,
  traces: TraceContextStore,
): Logger {
  return pino(
    {
      level: options.level,
      base: { service: options.service, environment: options.environment },
      messageKey: 'message',
      errorKey: 'error',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (label: string): { level: string } => ({ level: label }) },
      serializers: { error: serializeError },
      redact: { paths: SENSITIVE_PATHS, censor: '[REDACTED]' },
      mixin: (): object => traceFieldsOf(traces.current()),
    },
    destination,
  );
}

function serializeError(error: Error): SerializedError {
  return {
    type: error.constructor.name,
    message: error.message,
    stack: error.stack ?? null,
    code: 'code' in error && typeof error.code === 'string' ? error.code : null,
  };
}

function contextOf(params: readonly unknown[]): string {
  const last = params.at(-1);
  return typeof last === 'string' ? last : 'Nest';
}
