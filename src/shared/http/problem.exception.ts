import { HttpException, HttpStatus } from '@nestjs/common';
import { type InvariantViolated } from '@shared/errors/invariant-violated.error';
import { type Failure } from '@shared/result/failure';
import { buildProblemDetails } from './build-problem-details';
import { type ProblemDetails } from './problem-details';
import { type ProblemExtensions } from './problem-extensions';

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
