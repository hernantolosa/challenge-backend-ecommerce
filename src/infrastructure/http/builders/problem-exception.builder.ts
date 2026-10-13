import { HttpStatus } from '@nestjs/common';
import { type Failure } from '@utils/result/interfaces/failure.interface';
import { buildProblemDetails } from './problem-details.builder';
import { type ProblemExtensions } from '@infrastructure/http/types/problem-extensions.type';
import { ProblemException } from '@infrastructure/http/exceptions/problem.exception';

export class ProblemExceptionBuilder {
  static badRequest(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemExceptionBuilder.problem(HttpStatus.BAD_REQUEST, failure, detail, extensions);
  }

  static notFound(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemExceptionBuilder.problem(HttpStatus.NOT_FOUND, failure, detail, extensions);
  }

  static conflict(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemExceptionBuilder.problem(HttpStatus.CONFLICT, failure, detail, extensions);
  }

  static unprocessable(
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return ProblemExceptionBuilder.problem(
      HttpStatus.UNPROCESSABLE_ENTITY,
      failure,
      detail,
      extensions,
    );
  }

  private static problem(
    status: HttpStatus,
    failure: Failure,
    detail: string,
    extensions?: ProblemExtensions,
  ): ProblemException {
    return new ProblemException(buildProblemDetails(status, failure.kind, detail, extensions));
  }
}
