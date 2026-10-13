import { type RequestHandler } from 'express';
import { RequestLogState } from '../tracing/request-log-state';
import { type TraceContextStore } from '../tracing/trace-context.store';

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
