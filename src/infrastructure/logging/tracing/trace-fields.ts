import { type TraceContext } from '../interfaces/trace-context.interface';
import { type LogFields } from '../types/log-fields.type';

export function traceFieldsOf(trace: TraceContext | undefined): LogFields {
  if (trace === undefined) return {};

  return { traceId: trace.traceId, spanId: trace.spanId, parentSpanId: trace.parentSpanId };
}
