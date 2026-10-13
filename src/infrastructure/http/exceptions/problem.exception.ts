import { HttpException } from '@nestjs/common';
import { type ProblemDetails } from '../interfaces/problem-details.interface';

export class ProblemException extends HttpException {
  constructor(readonly problem: ProblemDetails) {
    super(problem, problem.status);
  }
}
