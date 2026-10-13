import { HttpStatus } from '@nestjs/common';
import { LogLevel } from '@infrastructure/logging/enums/log-level';

const SECURITY_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.TOO_MANY_REQUESTS,
]);
const UNLOGGED_PATHS: ReadonlySet<string> = new Set(['/health']);
const FIRST_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

export function accessLogLevelFor(status: number): LogLevel {
  if (status >= FIRST_SERVER_ERROR) return LogLevel.ERROR;
  if (SECURITY_STATUSES.has(status)) return LogLevel.WARN;
  return LogLevel.INFO;
}

export function shouldLogAccessTo(path: string): boolean {
  return !UNLOGGED_PATHS.has(path);
}
