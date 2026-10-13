import { randomBytes } from 'node:crypto';
import { type IncomingMessage } from 'node:http';

export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId: string | null;
}

const TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/;
const FORBIDDEN_VERSION = 'ff';
const INVALID_TRACE_ID = '0'.repeat(32);
const INVALID_SPAN_ID = '0'.repeat(16);
const contexts = new WeakMap<IncomingMessage, TraceContext>();

export function startTrace(request: IncomingMessage): TraceContext {
  const incoming = incomingTraceOf(request.headers.traceparent);
  const context = {
    traceId: incoming?.traceId ?? randomBytes(16).toString('hex'),
    spanId: randomBytes(8).toString('hex'),
    parentSpanId: incoming?.parentSpanId ?? null,
  };
  contexts.set(request, context);
  return context;
}

export function traceContextOf(request: IncomingMessage): TraceContext | undefined {
  return contexts.get(request);
}

function incomingTraceOf(
  header: string | string[] | undefined,
): Pick<TraceContext, 'traceId' | 'parentSpanId'> | null {
  const [, version, traceId, parentSpanId] = TRACEPARENT_PATTERN.exec(String(header)) ?? [];
  if (version === undefined || traceId === undefined || parentSpanId === undefined) return null;
  if (version === FORBIDDEN_VERSION || traceId === INVALID_TRACE_ID) return null;
  if (parentSpanId === INVALID_SPAN_ID) return null;

  return { traceId, parentSpanId };
}
