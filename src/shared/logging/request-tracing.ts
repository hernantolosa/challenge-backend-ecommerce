import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';
import { type Response } from 'express';

export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId: string | null;
  readonly traceFlags: string;
}

interface IncomingTrace {
  readonly traceId: string;
  readonly parentSpanId: string;
  readonly traceFlags: string;
}

const TRACEPARENT_PATTERN = /^[0-9a-f]{2}-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/;
const FORBIDDEN_VERSION = 'ff';
const INVALID_TRACE_ID = '0'.repeat(32);
const INVALID_SPAN_ID = '0'.repeat(16);
const SAMPLED = '01';
const NANOSECONDS_PER_MILLISECOND = 1_000_000;

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

export function startServerSpan(traceparent: string | undefined): TraceContext {
  const incoming = parseTraceparent(traceparent);

  return {
    traceId: incoming?.traceId ?? randomBytes(16).toString('hex'),
    spanId: randomBytes(8).toString('hex'),
    parentSpanId: incoming?.parentSpanId ?? null,
    traceFlags: incoming?.traceFlags ?? SAMPLED,
  };
}

export function traceFieldsOf(trace: TraceContext | undefined): Readonly<Record<string, unknown>> {
  if (trace === undefined) return {};

  return { traceId: trace.traceId, spanId: trace.spanId, parentSpanId: trace.parentSpanId };
}

export class TraceContextStore {
  private readonly storage = new AsyncLocalStorage<TraceContext>();

  run<T>(trace: TraceContext, callback: () => T): T {
    return this.storage.run(trace, callback);
  }

  current(): TraceContext | undefined {
    return this.storage.getStore();
  }
}

export class RequestTrace {
  private static readonly traces = new WeakMap<Response, RequestTrace>();
  private outcomeCode: string | null = null;

  private constructor(
    readonly context: TraceContext,
    private readonly startedAt: bigint,
  ) {}

  static start(response: Response, context: TraceContext): RequestTrace {
    const trace = new RequestTrace(context, process.hrtime.bigint());
    RequestTrace.traces.set(response, trace);
    return trace;
  }

  static of(response: Response): RequestTrace | undefined {
    return RequestTrace.traces.get(response);
  }

  recordOutcome(code: string): void {
    this.outcomeCode = code;
  }

  get outcome(): string | null {
    return this.outcomeCode;
  }

  elapsedMilliseconds(): number {
    const elapsed = Number(process.hrtime.bigint() - this.startedAt);
    return Math.round((elapsed / NANOSECONDS_PER_MILLISECOND) * 100) / 100;
  }
}
