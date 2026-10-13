import { pino, type Logger } from 'pino';
import { type Environment } from '@infrastructure/config/schemas/environment.schema';
import { type LoggerOptions } from '@infrastructure/logging/interfaces/logger-options.interface';
import { type TraceContextStore } from '@infrastructure/logging/tracing/trace-context.store';
import { traceFieldsOf } from '@infrastructure/logging/tracing/trace-fields';
import { AppLogger } from './app-logger';
import { serializeError } from './serialize-error';
import { type LogDestination } from './log-destination';

const SERVICE_NAME = 'ecommerce-api';
const REDACTED = '[REDACTED]';
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

export function createAppLogger(
  environment: Environment,
  destination: LogDestination,
  traces: TraceContextStore,
): AppLogger {
  const options: LoggerOptions = {
    level: environment.LOG_LEVEL,
    service: SERVICE_NAME,
    environment: environment.NODE_ENV,
  };
  return new AppLogger(createPinoLogger(options, destination, traces));
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
      redact: { paths: SENSITIVE_PATHS, censor: REDACTED },
      mixin: (): object => traceFieldsOf(traces.current()),
    },
    destination,
  );
}
