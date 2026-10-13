import { type RequestHandler } from 'express';
import { RequestLogState } from '@infrastructure/logging/tracing/request-log-state';
import { type TraceContextStore } from '@infrastructure/logging/tracing/trace-context.store';

export function bindRequestTrace(traces: TraceContextStore): RequestHandler {
  return (_request, response, next) => {
    const state = RequestLogState.of(response);
    if (state === undefined) {
      next();
      return;
    }
    traces.run(state.trace, next);
  };
}
