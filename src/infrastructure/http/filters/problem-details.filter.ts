import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { type Response } from 'express';
import {
  internalErrorProblem,
  toProblemDetails,
} from '@infrastructure/http/converters/to-problem-details.converter';
import { type ProblemDetails } from '@infrastructure/http/interfaces/problem-details.interface';
import { type AppLogger } from '@infrastructure/logging/logger/app-logger';
import { RequestLogState } from '@infrastructure/logging/tracing/request-log-state';
import { traceFieldsOf } from '@infrastructure/logging/tracing/trace-fields';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';
const RETRY_AFTER_SECONDS = '1';
const FIRST_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;
const SERVICE_UNAVAILABLE: number = HttpStatus.SERVICE_UNAVAILABLE;

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const state = RequestLogState.of(response);
    const problem = toProblemDetails(exception) ?? internalErrorProblem();

    if (problem.status >= FIRST_SERVER_ERROR) this.reportServerError(exception, state);
    if (problem.status === SERVICE_UNAVAILABLE)
      response.setHeader('Retry-After', RETRY_AFTER_SECONDS);
    state?.recordOutcome(problem.code);
    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(withTraceId(problem, state));
  }

  private reportServerError(exception: unknown, state: RequestLogState | undefined): void {
    this.logger.error('Request failed with a server error', exception, traceFieldsOf(state?.trace));
  }
}

function withTraceId(problem: ProblemDetails, state: RequestLogState | undefined): ProblemDetails {
  return state === undefined ? problem : { ...problem, traceId: state.trace.traceId };
}
