import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION = '23505';
const LOCK_NOT_AVAILABLE = '55P03';
const QUERY_CANCELED = '57014';
const UNAVAILABLE_CODES: ReadonlySet<string> = new Set([LOCK_NOT_AVAILABLE, QUERY_CANCELED]);
const POOL_TIMEOUT_MESSAGES: ReadonlySet<string> = new Set([
  'timeout exceeded when trying to connect',
  'Connection terminated due to connection timeout',
]);

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  if (!(error instanceof QueryFailedError)) return false;

  const driverError: unknown = error.driverError;
  return (
    typeof driverError === 'object' &&
    driverError !== null &&
    'code' in driverError &&
    driverError.code === UNIQUE_VIOLATION &&
    'constraint' in driverError &&
    driverError.constraint === constraint
  );
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof QueryFailedError) {
    const driverError: unknown = error.driverError;
    return UNAVAILABLE_CODES.has(driverCodeOf(driverError));
  }

  return error instanceof Error && POOL_TIMEOUT_MESSAGES.has(error.message);
}

function driverCodeOf(driverError: unknown): string {
  if (typeof driverError !== 'object' || driverError === null || !('code' in driverError))
    return '';

  return typeof driverError.code === 'string' ? driverError.code : '';
}
