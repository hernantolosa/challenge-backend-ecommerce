import { LogLevel, AppLogger, createPinoLogger } from '@shared/logging/app-logger';
import { TraceContextStore } from '@shared/logging/request-tracing';
import { aTraceContext, SPAN_ID, TRACE_ID } from '@test/fixtures/trace.fixtures';
import { MemoryLogDestination } from '@test/fakes/memory-log-destination';

describe('AppLogger', () => {
  let destination: MemoryLogDestination;
  let traces: TraceContextStore;
  let logger: AppLogger;

  beforeEach(() => {
    destination = new MemoryLogDestination();
    traces = new TraceContextStore();
    logger = new AppLogger(
      createPinoLogger(
        { level: LogLevel.INFO, service: 'ecommerce-api', environment: 'test' },
        destination,
        traces,
      ),
    );
  });

  it('writes one JSON line with the defined format', () => {
    logger.info('stock movement recorded', { sku: 'SNK-1' });

    expect(destination.entries()).toEqual([
      {
        level: 'info',
        time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) as unknown,
        service: 'ecommerce-api',
        environment: 'test',
        message: 'stock movement recorded',
        sku: 'SNK-1',
      },
    ]);
  });

  it('adds the trace and span ids of the current request automatically', () => {
    traces.run(aTraceContext(), () => logger.info('inside a request'));

    expect(destination.entries()[0]).toMatchObject({
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      parentSpanId: null,
    });
  });

  it('does not invent trace ids outside a request', () => {
    logger.info('background work');

    expect(destination.entries()[0]).not.toHaveProperty('traceId');
  });

  it('serializes errors with their type, message and stack', () => {
    logger.error('database unavailable', new TypeError('connection refused'));

    expect(destination.entries()[0]).toMatchObject({
      level: 'error',
      error: { type: 'TypeError', message: 'connection refused' },
    });
    expect(destination.raw).toContain('at ');
  });

  it('redacts credentials even if a caller logs them by mistake', () => {
    logger.info('incoming request', {
      authorization: 'Bearer secret-token',
      headers: { authorization: 'Bearer secret-token' },
      password: 'hunter2',
    });

    expect(destination.raw).not.toContain('secret-token');
    expect(destination.raw).not.toContain('hunter2');
    expect(destination.entries()[0]).toMatchObject({ authorization: '[REDACTED]' });
  });

  it('drops entries below the configured level', () => {
    logger.debug('noisy detail');

    expect(destination.entries()).toHaveLength(0);
  });
});
