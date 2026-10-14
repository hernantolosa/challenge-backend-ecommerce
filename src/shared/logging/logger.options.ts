import { HttpStatus } from '@nestjs/common';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { type Options } from 'pino-http';
import {
  pino,
  type LevelWithSilent,
  type SerializedError,
  type SerializedRequest,
  type SerializedResponse,
} from 'pino';
import { type Environment } from '@config/environment.schema';
import { outcomeOf } from './request-outcome';
import { startTrace, traceContextOf } from './request-trace';

const SERVICE_NAME = 'ecommerce-api';
const TRACE_ID_HEADER = 'X-Trace-Id';
const UNLOGGED_PATHS: ReadonlySet<string> = new Set(['/health']);
const SECURITY_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.TOO_MANY_REQUESTS,
]);
const FIRST_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

export function httpLoggerOptions(environment: Environment): Options {
  return {
    level: environment.LOG_LEVEL,
    base: { service: SERVICE_NAME, environment: environment.NODE_ENV },
    messageKey: 'message',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label: string): { level: string } => ({ level: label }) },
    redact: {
      paths: ['*.authorization', '*.password', '*.token', '*.secret'],
      censor: '[REDACTED]',
    },
    serializers: { req: serializeRequest, res: serializeResponse, err: serializeError },
    customAttributeKeys: { responseTime: 'durationMs' },
    genReqId: (request: IncomingMessage, response: ServerResponse): string => {
      const { traceId } = startTrace(request);
      response.setHeader(TRACE_ID_HEADER, traceId);
      return traceId;
    },
    customProps: (request: IncomingMessage): object => traceContextOf(request) ?? {},
    autoLogging: {
      ignore: (request: IncomingMessage): boolean => UNLOGGED_PATHS.has(pathOf(request.url)),
    },
    customLogLevel: (_request: IncomingMessage, response: ServerResponse): LevelWithSilent =>
      accessLogLevelFor(response.statusCode),
    customSuccessMessage: (): string => 'request completed',
    customErrorMessage: (): string => 'request completed',
    customSuccessObject: (
      request: IncomingMessage,
      response: ServerResponse,
      log: object,
    ): object => withOutcome(request, response, log),
    customErrorObject: (
      request: IncomingMessage,
      response: ServerResponse,
      _error: Error,
      log: object,
    ): object => withOutcome(request, response, withoutError(log)),
  };
}

export function accessLogLevelFor(status: number): LevelWithSilent {
  if (status >= FIRST_SERVER_ERROR) return 'error';
  if (SECURITY_STATUSES.has(status)) return 'warn';
  return 'info';
}

function withOutcome(request: IncomingMessage, response: ServerResponse, log: object): object {
  return { ...log, outcome: outcomeOf(response), user: userOf(request) };
}

function withoutError(log: object): object {
  return Object.fromEntries(Object.entries(log).filter(([key]) => key !== 'err'));
}

function userOf(request: IncomingMessage): string | null {
  if (!('principal' in request)) return null;
  const { principal } = request;
  return typeof principal === 'object' &&
    principal !== null &&
    'subject' in principal &&
    typeof principal.subject === 'string'
    ? principal.subject
    : null;
}

function serializeRequest(request: SerializedRequest): object {
  return { method: request.method, path: pathOf(request.url) };
}

function serializeResponse(response: SerializedResponse): object {
  return { statusCode: response.statusCode };
}

function serializeError(value: Error | SerializedError): object {
  const error = value instanceof Error ? value : value.raw;
  return {
    type: error.constructor.name,
    message: error.message,
    stack: error.stack ?? null,
    code: codeOf(error),
  };
}

function codeOf(error: Error): string | null {
  return 'code' in error && typeof error.code === 'string' ? error.code : null;
}

function pathOf(url: string | undefined): string {
  const [path] = (url ?? '').split('?');
  return path ?? '';
}
