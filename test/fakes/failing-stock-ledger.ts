import {
  type RecordEntryError,
  type LedgerEntry,
  type StockLedger,
} from '@stock/application/stock-ledger.port';
import { type StockMovement } from '@stock/domain/stock-movement';
import { type Result } from '@shared/result';
import { aQueryFailure } from '@test/fixtures/database-failure.fixtures';

const INPUT_OUTPUT_ERROR = '58030';

export class FailingStockLedger implements StockLedger {
  async record(_entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    throw aQueryFailure(INPUT_OUTPUT_ERROR);
  }

  async findMovement(): Promise<StockMovement | null> {
    throw aQueryFailure(INPUT_OUTPUT_ERROR);
  }
}
