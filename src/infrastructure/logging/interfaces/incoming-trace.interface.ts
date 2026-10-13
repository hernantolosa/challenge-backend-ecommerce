export interface IncomingTrace {
  readonly traceId: string;
  readonly parentSpanId: string;
  readonly traceFlags: string;
}
