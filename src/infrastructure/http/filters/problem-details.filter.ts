import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { type Response } from 'express';
import { type AppLogger } from '@infrastructure/logging/logger/app-logger';
import { RequestLogState } from '@infrastructure/logging/tracing/request-log-state';
import { traceFieldsOf } from '@infrastructure/logging/tracing/trace-fields';
import {
  internalErrorProblem,
  toProblemDetails,
} from '@infrastructure/http/converters/to-problem-details.converter';
import { type ProblemDetails } from '@infrastructure/http/interfaces/problem-details.interface';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const state = RequestLogState.of(response);
    const problem = toProblemDetails(exception) ?? this.reportUnexpected(exception, state);

    state?.recordOutcome(problem.code);
    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(withTraceId(problem, state));
  }

  private reportUnexpected(exception: unknown, state: RequestLogState | undefined): ProblemDetails {
    this.logger.error('Unhandled exception', exception, traceFieldsOf(state?.trace));
    return internalErrorProblem();
  }
}

function withTraceId(problem: ProblemDetails, state: RequestLogState | undefined): ProblemDetails {
  return state === undefined ? problem : { ...problem, traceId: state.trace.traceId };
}
