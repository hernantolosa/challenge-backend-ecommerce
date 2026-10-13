import { type RecordEntryError } from '@stock/application/errors/record-entry.error';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type Result } from '@utils/result/types/result.type';

export const DATABASE_FAILURE = 'connect ECONNREFUSED 10.0.0.5:5432';

export class FailingStockLedger implements StockLedger {
  async record(_entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    throw new Error(DATABASE_FAILURE);
  }

  async findMovement(): Promise<StockMovement | null> {
    throw new Error(DATABASE_FAILURE);
  }
}
