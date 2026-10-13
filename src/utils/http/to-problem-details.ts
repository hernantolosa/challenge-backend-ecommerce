import { HttpException, HttpStatus } from '@nestjs/common';
import { type ClientHttpError } from './client-http-error.interface';
import { problemDetails, titleOf } from './problem-details';
import { type ProblemDetails } from './problem-details.interface';
import { ProblemException } from './problem.exception';

const VALIDATION_FAILED = 'Request validation failed';
const BAD_REQUEST: number = HttpStatus.BAD_REQUEST;

export function toProblemDetails(exception: unknown): ProblemDetails | null {
  if (exception instanceof ProblemException) return exception.problem;
  if (exception instanceof HttpException) return fromHttpException(exception);
  if (isClientHttpError(exception)) return fromStatus(exception.status, exception.message);

  return null;
}

export function internalErrorProblem(): ProblemDetails {
  const status = HttpStatus.INTERNAL_SERVER_ERROR;
  return problemDetails(status, codeOf(status), 'An unexpected error occurred');
}

function fromHttpException(exception: HttpException): ProblemDetails {
  const status = exception.getStatus();
  const messages = messagesOf(exception.getResponse());

  if (messages.length > 1 || status === BAD_REQUEST) {
    return problemDetails(status, codeOf(status), detailOf(messages), { errors: messages });
  }
  return fromStatus(status, messages[0] ?? titleOf(status));
}

function fromStatus(status: number, detail: string): ProblemDetails {
  return problemDetails(status, codeOf(status), detail);
}

function detailOf(messages: readonly string[]): string {
  return messages.length === 1 && messages[0] !== undefined ? messages[0] : VALIDATION_FAILED;
}

function messagesOf(response: string | object): string[] {
  if (typeof response === 'string') return [response];
  if (!('message' in response)) return [];

  const { message } = response;
  if (typeof message === 'string') return [message];
  return Array.isArray(message) ? message.filter((item) => typeof item === 'string') : [];
}

function codeOf(status: number): string {
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
