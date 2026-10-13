import { QueryFailedError } from 'typeorm';
import { type RecordEntryError } from '@stock/application/errors/record-entry.error';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type Result } from '@utils/result/types/result.type';

export const DATABASE_FAILURE = 'could not access file "base/16384/2601": Input/output error';
export const LEAKED_SQL = 'SELECT movement.id FROM stock_movements WHERE actor = $1';
export const LEAKED_PARAMETER = 'operator.private@example.com';

export class FailingStockLedger implements StockLedger {
  async record(_entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    throw databaseFailure();
  }

  async findMovement(): Promise<StockMovement | null> {
    throw databaseFailure();
  }
}

function databaseFailure(): QueryFailedError {
  const driverError = Object.assign(new Error(DATABASE_FAILURE), {
    code: '58030',
    detail: `Key (actor)=(${LEAKED_PARAMETER})`,
  });
  return new QueryFailedError(LEAKED_SQL, [LEAKED_PARAMETER], driverError);
}
