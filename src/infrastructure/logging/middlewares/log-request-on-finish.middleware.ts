import { type Request, type RequestHandler, type Response } from 'express';
import { type AuthenticatedRequest } from '@infrastructure/auth/interfaces/authenticated-request.interface';
import { type AppLogger } from '@infrastructure/logging/logger/app-logger';
import {
  accessLogLevelFor,
  shouldLogAccessTo,
} from '@infrastructure/logging/policies/access-log.policy';
import { RequestLogState } from '@infrastructure/logging/tracing/request-log-state';
import { traceFieldsOf } from '@infrastructure/logging/tracing/trace-fields';

const SUCCESS_OUTCOME = 'Ok';

export function logRequestOnFinish(logger: AppLogger): RequestHandler {
  return (request, response, next) => {
    if (shouldLogAccessTo(pathOf(request))) {
      response.once('finish', () => writeAccessLog(logger, request, response));
    }
    next();
  };
}

function writeAccessLog(
  logger: AppLogger,
  request: AuthenticatedRequest,
  response: Response,
): void {
  const state = RequestLogState.of(response);
  if (state === undefined) return;

  logger.atLevel(accessLogLevelFor(response.statusCode), 'request completed', {
    ...traceFieldsOf(state.trace),
    http: {
      method: request.method,
      path: pathOf(request),
      status: response.statusCode,
      durationMs: state.elapsedMilliseconds(),
    },
    outcome: state.outcome ?? SUCCESS_OUTCOME,
    actor: request.principal?.subject ?? null,
  });
}

function pathOf(request: Request): string {
  const [path] = request.originalUrl.split('?');
  return path ?? request.originalUrl;
}
