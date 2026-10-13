import { startTrace, traceContextOf } from '@shared/logging/request-trace';
import {
  aRequestWithTraceparent,
  aTraceparent,
  PARENT_SPAN_ID,
  SPAN_ID_FORMAT,
  TRACE_ID,
  TRACE_ID_FORMAT,
} from '@test/fixtures/trace.fixtures';

describe('startTrace', () => {
  it('continues the trace of an incoming W3C traceparent under a new span', () => {
    const context = startTrace(aRequestWithTraceparent(aTraceparent()));

    expect(context).toMatchObject({ traceId: TRACE_ID, parentSpanId: PARENT_SPAN_ID });
    expect(context.spanId).toMatch(SPAN_ID_FORMAT);
    expect(context.spanId).not.toBe(PARENT_SPAN_ID);
  });

  it('starts a new trace when the request carries none', () => {
    const context = startTrace(aRequestWithTraceparent());

    expect(context.traceId).toMatch(TRACE_ID_FORMAT);
    expect(context.parentSpanId).toBeNull();
  });

  it.each([
    ['free text', 'my-trace'],
    ['uppercase hex', aTraceparent().toUpperCase()],
    ['the forbidden ff version', `ff-${TRACE_ID}-${PARENT_SPAN_ID}-01`],
    ['an all zero trace id', `00-${'0'.repeat(32)}-${PARENT_SPAN_ID}-01`],
    ['an all zero parent span id', `00-${TRACE_ID}-${'0'.repeat(16)}-01`],
    ['trailing data', `${aTraceparent()}-extra`],
  ])('ignores a traceparent with %s and starts a new trace', (_case, header) => {
    const context = startTrace(aRequestWithTraceparent(header));

    expect(context.traceId).not.toBe(TRACE_ID);
    expect(context.parentSpanId).toBeNull();
  });

  it('remembers the trace of each request', () => {
    const request = aRequestWithTraceparent(aTraceparent());

    const context = startTrace(request);

    expect(traceContextOf(request)).toBe(context);
  });

  it('never reuses ids across requests', () => {
    const first = startTrace(aRequestWithTraceparent());
    const second = startTrace(aRequestWithTraceparent());

    expect(first.traceId).not.toBe(second.traceId);
    expect(first.spanId).not.toBe(second.spanId);
  });
});
