import { type InvariantViolated } from '@utils/errors/invariant-violated.error';
import { ProblemExceptionBuilder } from '@infrastructure/http/builders/problem-exception.builder';
import { type ProblemException } from '@infrastructure/http/exceptions/problem.exception';

export class CommonProblems {
  static invariantViolated(error: InvariantViolated): ProblemException {
    return ProblemExceptionBuilder.badRequest(error, error.message, { field: error.field });
  }
}
