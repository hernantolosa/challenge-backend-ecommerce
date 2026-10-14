import { pino } from 'pino';
import { type Environment } from '@config/environment.schema';
import { accessLogLevelFor, httpLoggerOptions } from '@shared/logging/logger.options';
import { MemoryLogDestination } from '@test/fakes/memory-log-destination';
import {
  aQueryFailure,
  LEAKED_PARAMETER,
  LEAKED_SQL,
} from '@test/fixtures/database-failure.fixtures';

function aLoggerWritingTo(destination: MemoryLogDestination): pino.Logger {
  const environment = { LOG_LEVEL: 'info', NODE_ENV: 'test' } as Environment;
  return pino(httpLoggerOptions(environment), destination);
}

describe('logger options', () => {
  let destination: MemoryLogDestination;
  let logger: pino.Logger;

  beforeEach(() => {
    destination = new MemoryLogDestination();
    logger = aLoggerWritingTo(destination);
  });

  it('writes one JSON line with the defined format', () => {
    logger.info('stock movement recorded');

    expect(destination.entries()).toEqual([
      {
        level: 'info',
        time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) as unknown,
        service: 'ecommerce-api',
        environment: 'test',
        message: 'stock movement recorded',
      },
    ]);
  });

  it('logs errors as type, message, stack and code, never SQL or parameters', () => {
    logger.error({ err: aQueryFailure('58030') }, 'database failure');

    expect(destination.entries()[0]).toMatchObject({
      err: { type: 'QueryFailedError', code: '58030' },
    });
    expect(destination.raw).not.toContain(LEAKED_SQL);
    expect(destination.raw).not.toContain(LEAKED_PARAMETER);
  });

  it('redacts credentials even if a caller logs them by mistake', () => {
    logger.info({ headers: { authorization: 'Bearer secret-token' } }, 'incoming request');

    expect(destination.raw).not.toContain('secret-token');
  });
});

describe('accessLogLevelFor', () => {
  it.each([
    [200, 'info'],
    [409, 'info'],
    [401, 'warn'],
    [403, 'warn'],
    [429, 'warn'],
    [500, 'error'],
    [503, 'error'],
  ])('logs a %p response at %p level', (status, level) => {
    expect(accessLogLevelFor(status)).toBe(level);
  });
});
