import { Catch, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { type Response } from 'express';
import { type ProblemDetails } from '../interfaces/problem-details.interface';
import { internalErrorProblem, toProblemDetails } from '../converters/to-problem-details.converter';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const problem = toProblemDetails(exception) ?? this.unexpected(exception);

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(problem.status)
      .type(PROBLEM_CONTENT_TYPE)
      .json(problem);
  }

  private unexpected(exception: unknown): ProblemDetails {
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return internalErrorProblem();
  }
}
