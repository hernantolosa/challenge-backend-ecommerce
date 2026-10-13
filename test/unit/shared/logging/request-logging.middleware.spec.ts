import { LogLevel } from '@shared/logging/app-logger';
import { accessLogLevelFor } from '@shared/logging/request-logging.middleware';

describe('access log policy', () => {
  it.each([
    [200, LogLevel.INFO],
    [201, LogLevel.INFO],
    [400, LogLevel.INFO],
    [404, LogLevel.INFO],
    [409, LogLevel.INFO],
    [401, LogLevel.WARN],
    [403, LogLevel.WARN],
    [429, LogLevel.WARN],
    [500, LogLevel.ERROR],
    [503, LogLevel.ERROR],
  ])('logs a %p response at %p level', (status, level) => {
    expect(accessLogLevelFor(status)).toBe(level);
  });
});
