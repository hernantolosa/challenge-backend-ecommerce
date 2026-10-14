import { HttpException, HttpStatus } from '@nestjs/common';
import { isDatabaseUnavailable } from '@shared/database/postgres-errors';
import { buildProblemDetails, titleOf } from './build-problem-details';
import { type ClientHttpError } from './client-http-error.interface';
import { ProblemException } from './problem.exception';
import { type ProblemDetails } from './problem-details.interface';

const VALIDATION_FAILED = 'Request validation failed';
const BAD_REQUEST: number = HttpStatus.BAD_REQUEST;

export function toProblemDetails(exception: unknown): ProblemDetails | null {
  if (exception instanceof ProblemException) {
    return exception.problem;
  }
  if (exception instanceof HttpException) {
    return problemFromHttpException(exception);
  }
  if (isClientHttpError(exception)) {
    return problemFromStatus(exception.status, exception.message);
  }
  if (isDatabaseUnavailable(exception)) {
    return serviceUnavailableProblem();
  }

  return null;
}

export function serviceUnavailableProblem(): ProblemDetails {
  return problemFromStatus(HttpStatus.SERVICE_UNAVAILABLE, 'The service is busy, retry later');
}

export function internalErrorProblem(): ProblemDetails {
  return problemFromStatus(HttpStatus.INTERNAL_SERVER_ERROR, 'An unexpected error occurred');
}

function problemFromHttpException(exception: HttpException): ProblemDetails {
  const status = exception.getStatus();
  const messages = extractMessages(exception.getResponse());

  if (messages.length > 1 || status === BAD_REQUEST) {
    const detail =
      messages.length === 1 && messages[0] !== undefined ? messages[0] : VALIDATION_FAILED;
    return buildProblemDetails(status, problemCodeFor(status), detail, { errors: messages });
  }
  return problemFromStatus(status, messages[0] ?? titleOf(status));
}

function problemFromStatus(status: number, detail: string): ProblemDetails {
  return buildProblemDetails(status, problemCodeFor(status), detail);
}

function extractMessages(response: string | object): string[] {
  if (typeof response === 'string') {
    return [response];
  }
  if (!('message' in response)) {
    return [];
  }

  const { message } = response;
  if (typeof message === 'string') {
    return [message];
  }
  return Array.isArray(message) ? message.filter((item) => typeof item === 'string') : [];
}

function problemCodeFor(status: number): string {
  return titleOf(status).replace(/[^A-Za-z]/g, '');
}

function isClientHttpError(exception: unknown): exception is ClientHttpError {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'expose' in exception &&
    exception.expose === true &&
    'status' in exception &&
    typeof exception.status === 'number' &&
    'message' in exception &&
    typeof exception.message === 'string'
  );
}
