import { type IncomingTrace } from '../interfaces/incoming-trace.interface';

const TRACEPARENT_PATTERN = /^[0-9a-f]{2}-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/;
const FORBIDDEN_VERSION = 'ff';
const INVALID_TRACE_ID = '0'.repeat(32);
const INVALID_SPAN_ID = '0'.repeat(16);

export function parseTraceparent(header: string | undefined): IncomingTrace | null {
  if (header === undefined || !TRACEPARENT_PATTERN.test(header)) return null;

  const version = header.slice(0, 2);
  const traceId = header.slice(3, 35);
  const parentSpanId = header.slice(36, 52);
  const traceFlags = header.slice(53, 55);

  if (version === FORBIDDEN_VERSION) return null;
  if (traceId === INVALID_TRACE_ID || parentSpanId === INVALID_SPAN_ID) return null;

  return { traceId, parentSpanId, traceFlags };
}
