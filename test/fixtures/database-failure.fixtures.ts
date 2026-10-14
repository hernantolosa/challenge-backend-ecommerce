import { QueryFailedError } from 'typeorm';

export const DATABASE_FAILURE = 'could not access file "base/16384/2601": Input/output error';
export const LEAKED_SQL = 'SELECT movement.id FROM stock_movements WHERE created_by = $1';
export const LEAKED_PARAMETER = 'operator.private@example.com';

export function aQueryFailure(code: string, message = DATABASE_FAILURE): QueryFailedError {
  const driverError = Object.assign(new Error(message), {
    code,
    detail: `Key (created_by)=(${LEAKED_PARAMETER})`,
  });
  return new QueryFailedError(LEAKED_SQL, [LEAKED_PARAMETER], driverError);
}
