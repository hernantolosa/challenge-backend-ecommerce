import { type InvariantViolated } from '@utils/errors/invariant-violated.error';
import { HttpOutcome } from '@infrastructure/http/builders/http-outcome.builder';
import { type ProblemException } from '@infrastructure/http/exceptions/problem.exception';

export class CommonProblems {
  static invariantViolated(error: InvariantViolated): ProblemException {
    return HttpOutcome.badRequest(error, error.message, { field: error.field });
  }
}
