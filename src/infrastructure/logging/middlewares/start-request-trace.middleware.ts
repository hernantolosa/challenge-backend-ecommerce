import { type RequestHandler } from 'express';
import { RequestLogState } from '@infrastructure/logging/tracing/request-log-state';
import { startServerSpan } from '@infrastructure/logging/tracing/start-server-span';

const TRACE_ID_HEADER = 'X-Trace-Id';
const TRACEPARENT_HEADER = 'traceparent';

export function startRequestTrace(): RequestHandler {
  return (request, response, next) => {
    const trace = startServerSpan(request.header(TRACEPARENT_HEADER));
    RequestLogState.start(response, trace);
    response.setHeader(TRACE_ID_HEADER, trace.traceId);
    next();
  };
}
