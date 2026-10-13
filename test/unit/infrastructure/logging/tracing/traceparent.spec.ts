import { parseTraceparent } from '@infrastructure/logging/tracing/traceparent';

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const PARENT_SPAN_ID = '00f067aa0ba902b7';

describe('parseTraceparent', () => {
  it('reads the trace id, parent span and flags of a W3C traceparent header', () => {
    expect(parseTraceparent(`00-${TRACE_ID}-${PARENT_SPAN_ID}-01`)).toEqual({
      traceId: TRACE_ID,
      parentSpanId: PARENT_SPAN_ID,
      traceFlags: '01',
    });
  });

  it.each([
    ['a missing header', undefined],
    ['an empty header', ''],
    ['free text', 'my-trace'],
    ['uppercase hex', `00-${TRACE_ID.toUpperCase()}-${PARENT_SPAN_ID}-01`],
    ['a short trace id', `00-${TRACE_ID.slice(1)}-${PARENT_SPAN_ID}-01`],
    ['the forbidden ff version', `ff-${TRACE_ID}-${PARENT_SPAN_ID}-01`],
    ['an all zero trace id', `00-${'0'.repeat(32)}-${PARENT_SPAN_ID}-01`],
    ['an all zero parent span id', `00-${TRACE_ID}-${'0'.repeat(16)}-01`],
    ['trailing data', `00-${TRACE_ID}-${PARENT_SPAN_ID}-01-extra`],
  ])('ignores %s', (_case, header) => {
    expect(parseTraceparent(header)).toBeNull();
  });
});
