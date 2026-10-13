import { HttpException, HttpStatus } from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import { type InvariantViolated } from '@shared/invariant-violated';
import { type Failure } from '@shared/result';

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly code: string;
  readonly [extension: string]: unknown;
}

export type ProblemExtensions = Readonly<Record<string, unknown>>;

export function buildProblemDetails(
  status: number,
  code: string,
  detail: string,
  extensions: ProblemExtensions = {},
): ProblemDetails {
  return { ...extensions, type: 'about:blank', title: titleOf(status), status, detail, code };
}

export function titleOf(status: number): string {
  return STATUS_CODES[status] ?? 'Error';
}

export class ProblemException extends HttpException {
  constructor(readonly problem: ProblemDetails) {
    super(problem, problem.status);
  }

  static invariantViolated(error: InvariantViolated): ProblemException {
    return ProblemException.badRequest(error, error.message, { field: error.field });
  }

  static badRequest(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemException.of(HttpStatus.BAD_REQUEST, failure, detail, extensions);
  }

  static notFound(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemException.of(HttpStatus.NOT_FOUND, failure, detail, extensions);
  }

  static conflict(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemException.of(HttpStatus.CONFLICT, failure, detail, extensions);
  }

  static unprocessable(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemException.of(HttpStatus.UNPROCESSABLE_ENTITY, failure, detail, extensions);
  }

  private static of(
    status: HttpStatus,
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return new ProblemException(buildProblemDetails(status, failure.kind, detail, extensions));
  }
}
