import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { recordOutcome } from '@shared/logging/request-outcome';
import { traceContextOf } from '@shared/logging/request-trace';
import { internalErrorProblem, toProblemDetails } from './problem-details.converter';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';
const FIRST_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;
const SERVICE_UNAVAILABLE: number = HttpStatus.SERVICE_UNAVAILABLE;

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    logger.setContext(ProblemDetailsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const trace = traceContextOf(http.getRequest<Request>());
    const problem = toProblemDetails(exception) ?? internalErrorProblem();

    if (problem.status >= FIRST_SERVER_ERROR) {
      this.logger.error({ err: exception }, 'Request failed with a server error');
    }
    if (problem.status === SERVICE_UNAVAILABLE) {
      response.setHeader('Retry-After', '1');
    }
    recordOutcome(response, problem.code);

    const body = trace === undefined ? problem : { ...problem, traceId: trace.traceId };
    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(body);
  }
}
