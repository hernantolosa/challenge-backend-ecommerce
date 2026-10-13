import { randomBytes } from 'node:crypto';
import { type TraceContext } from '../interfaces/trace-context.interface';
import { parseTraceparent } from './traceparent';

const TRACE_ID_BYTES = 16;
const SPAN_ID_BYTES = 8;
const SAMPLED = '01';

export function startServerSpan(traceparent: string | undefined): TraceContext {
  const incoming = parseTraceparent(traceparent);

  return {
    traceId: incoming?.traceId ?? randomHex(TRACE_ID_BYTES),
    spanId: randomHex(SPAN_ID_BYTES),
    parentSpanId: incoming?.parentSpanId ?? null,
    traceFlags: incoming?.traceFlags ?? SAMPLED,
  };
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}
