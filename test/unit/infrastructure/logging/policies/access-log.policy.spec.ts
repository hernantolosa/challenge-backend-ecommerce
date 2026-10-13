import { LogLevel } from '@infrastructure/logging/enums/log-level';
import {
  accessLogLevelFor,
  shouldLogAccessTo,
} from '@infrastructure/logging/policies/access-log.policy';

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

  it('skips the health check that load balancers poll constantly', () => {
    expect(shouldLogAccessTo('/health')).toBe(false);
  });

  it('logs business endpoints', () => {
    expect(shouldLogAccessTo('/stock/movimientos')).toBe(true);
  });
});
