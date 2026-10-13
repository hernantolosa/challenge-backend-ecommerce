import { type InvariantViolated } from '../../../utils/errors/invariant-violated.error';
import { HttpOutcome } from '../builders/http-outcome.builder';
import { type ProblemException } from '../exceptions/problem.exception';

export class CommonProblems {
  static invariantViolated(error: InvariantViolated): ProblemException {
    return HttpOutcome.badRequest(error, error.message, { field: error.field });
  }
}
