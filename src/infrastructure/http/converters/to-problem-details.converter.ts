import { HttpException, HttpStatus } from '@nestjs/common';
import { type ClientHttpError } from '@infrastructure/http/interfaces/client-http-error.interface';
import { problemDetails, titleOf } from '@infrastructure/http/builders/problem-details.builder';
import { type ProblemDetails } from '@infrastructure/http/interfaces/problem-details.interface';
import { ProblemException } from '@infrastructure/http/exceptions/problem.exception';

const VALIDATION_FAILED = 'Request validation failed';
const BAD_REQUEST: number = HttpStatus.BAD_REQUEST;

export function toProblemDetails(exception: unknown): ProblemDetails | null {
  if (exception instanceof ProblemException) return exception.problem;
  if (exception instanceof HttpException) return problemFromHttpException(exception);
  if (isClientHttpError(exception)) return problemFromStatus(exception.status, exception.message);

  return null;
}

export function internalErrorProblem(): ProblemDetails {
  const status = HttpStatus.INTERNAL_SERVER_ERROR;
  return problemDetails(status, problemCodeFor(status), 'An unexpected error occurred');
}

function problemFromHttpException(exception: HttpException): ProblemDetails {
  const status = exception.getStatus();
  const messages = extractMessages(exception.getResponse());

  if (messages.length > 1 || status === BAD_REQUEST) {
    return problemDetails(status, problemCodeFor(status), detailFromMessages(messages), {
      errors: messages,
    });
  }
  return problemFromStatus(status, messages[0] ?? titleOf(status));
}

function problemFromStatus(status: number, detail: string): ProblemDetails {
  return problemDetails(status, problemCodeFor(status), detail);
}

function detailFromMessages(messages: readonly string[]): string {
  return messages.length === 1 && messages[0] !== undefined ? messages[0] : VALIDATION_FAILED;
}

function extractMessages(response: string | object): string[] {
  if (typeof response === 'string') return [response];
  if (!('message' in response)) return [];

  const { message } = response;
  if (typeof message === 'string') return [message];
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
