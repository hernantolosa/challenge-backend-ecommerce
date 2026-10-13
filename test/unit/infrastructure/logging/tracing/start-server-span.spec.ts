import { startServerSpan } from '@infrastructure/logging/tracing/start-server-span';

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const PARENT_SPAN_ID = '00f067aa0ba902b7';
const HEX_32 = /^[0-9a-f]{32}$/;
const HEX_16 = /^[0-9a-f]{16}$/;

describe('startServerSpan', () => {
  it('continues the trace of an incoming request under a new span', () => {
    const span = startServerSpan(`00-${TRACE_ID}-${PARENT_SPAN_ID}-00`);

    expect(span).toMatchObject({
      traceId: TRACE_ID,
      parentSpanId: PARENT_SPAN_ID,
      traceFlags: '00',
    });
    expect(span.spanId).toMatch(HEX_16);
    expect(span.spanId).not.toBe(PARENT_SPAN_ID);
  });

  it('starts a new sampled trace when the request carries none', () => {
    const span = startServerSpan(undefined);

    expect(span.traceId).toMatch(HEX_32);
    expect(span.spanId).toMatch(HEX_16);
    expect(span).toMatchObject({ parentSpanId: null, traceFlags: '01' });
  });

  it('starts a new trace instead of trusting a malformed header', () => {
    expect(startServerSpan('not-a-traceparent').parentSpanId).toBeNull();
  });

  it('never reuses ids across requests', () => {
    const first = startServerSpan(undefined);
    const second = startServerSpan(undefined);

    expect(first.traceId).not.toBe(second.traceId);
    expect(first.spanId).not.toBe(second.spanId);
  });
});
