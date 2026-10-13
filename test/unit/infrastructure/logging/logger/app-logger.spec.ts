import { LogLevel } from '@infrastructure/logging/enums/log-level';
import { AppLogger } from '@infrastructure/logging/logger/app-logger';
import { createPinoLogger } from '@infrastructure/logging/logger/logger.factory';
import { TraceContextStore } from '@infrastructure/logging/tracing/trace-context.store';
import { MemoryLogDestination } from '@test/fakes/memory-log-destination';

const TRACE = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '00f067aa0ba902b7',
  parentSpanId: null,
  traceFlags: '01',
};

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
    traces.run(TRACE, () => logger.info('inside a request'));

    expect(destination.entries()[0]).toMatchObject({
      traceId: TRACE.traceId,
      spanId: TRACE.spanId,
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
