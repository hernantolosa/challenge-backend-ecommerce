import { type RecordEntryError } from '@stock/application/errors/record-entry.error';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type Result } from '@utils/result/types/result.type';
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
