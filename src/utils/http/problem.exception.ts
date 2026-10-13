import { HttpException } from '@nestjs/common';
import { type ProblemDetails } from './problem-details.interface';

export class ProblemException extends HttpException {
  constructor(readonly problem: ProblemDetails) {
    super(problem, problem.status);
  }
}
