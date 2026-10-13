import { startServerSpan } from '@infrastructure/logging/tracing/start-server-span';

import {
  PARENT_SPAN_ID,
  SPAN_ID_FORMAT,
  TRACE_ID,
  TRACE_ID_FORMAT,
} from '@test/fixtures/trace.fixtures';

describe('startServerSpan', () => {
  it('continues the trace of an incoming request under a new span', () => {
    const span = startServerSpan(`00-${TRACE_ID}-${PARENT_SPAN_ID}-00`);

    expect(span).toMatchObject({
      traceId: TRACE_ID,
      parentSpanId: PARENT_SPAN_ID,
      traceFlags: '00',
    });
    expect(span.spanId).toMatch(SPAN_ID_FORMAT);
    expect(span.spanId).not.toBe(PARENT_SPAN_ID);
  });

  it('starts a new sampled trace when the request carries none', () => {
    const span = startServerSpan(undefined);

    expect(span.traceId).toMatch(TRACE_ID_FORMAT);
    expect(span.spanId).toMatch(SPAN_ID_FORMAT);
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
