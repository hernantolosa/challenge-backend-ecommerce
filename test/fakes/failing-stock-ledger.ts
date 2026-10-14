import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type RecordedMovement } from '@stock/application/ports/recorded-movement.interface';
import { type Result } from '@shared/result/result.type';
import { aQueryFailure } from '@test/fixtures/database-failure.fixtures';

const INPUT_OUTPUT_ERROR = '58030';

export class FailingStockLedger implements StockLedger {
  async record(_entry: LedgerEntry): Promise<Result<RecordedMovement, RecordEntryError>> {
    throw aQueryFailure(INPUT_OUTPUT_ERROR);
  }
}
