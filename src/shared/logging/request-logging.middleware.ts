import { HttpStatus } from '@nestjs/common';
import { type Request, type RequestHandler, type Response } from 'express';
import { type AuthenticatedRequest } from '@shared/auth/principal';
import { LogLevel, type AppLogger } from './app-logger';
import {
  RequestTrace,
  startServerSpan,
  traceFieldsOf,
  type TraceContextStore,
} from './request-tracing';

const TRACE_ID_HEADER = 'X-Trace-Id';
const TRACEPARENT_HEADER = 'traceparent';
const UNLOGGED_PATHS: ReadonlySet<string> = new Set(['/health']);
const SECURITY_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.TOO_MANY_REQUESTS,
]);
const FIRST_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

export function startRequestTrace(): RequestHandler {
  return (request, response, next) => {
    const trace = RequestTrace.start(response, startServerSpan(request.header(TRACEPARENT_HEADER)));
    response.setHeader(TRACE_ID_HEADER, trace.context.traceId);
    next();
  };
}

export function bindRequestTrace(traces: TraceContextStore): RequestHandler {
  return (_request, response, next) => {
    const trace = RequestTrace.of(response);
    if (trace === undefined) {
      next();
      return;
    }
    traces.run(trace.context, next);
  };
}

export function logRequestOnFinish(logger: AppLogger): RequestHandler {
  return (request, response, next) => {
    if (!UNLOGGED_PATHS.has(pathOf(request))) {
      response.once('finish', () => writeAccessLog(logger, request, response));
    }
    next();
  };
}

export function accessLogLevelFor(status: number): LogLevel {
  if (status >= FIRST_SERVER_ERROR) return LogLevel.ERROR;
  if (SECURITY_STATUSES.has(status)) return LogLevel.WARN;
  return LogLevel.INFO;
}

function writeAccessLog(
  logger: AppLogger,
  request: AuthenticatedRequest,
  response: Response,
): void {
  const trace = RequestTrace.of(response);
  if (trace === undefined) return;

  logger.atLevel(accessLogLevelFor(response.statusCode), 'request completed', {
    ...traceFieldsOf(trace.context),
    http: {
      method: request.method,
      path: pathOf(request),
      status: response.statusCode,
      durationMs: trace.elapsedMilliseconds(),
    },
    outcome: trace.outcome ?? 'Ok',
    actor: request.principal?.subject ?? null,
  });
}

function pathOf(request: Request): string {
  const [path] = request.originalUrl.split('?');
  return path ?? request.originalUrl;
}
