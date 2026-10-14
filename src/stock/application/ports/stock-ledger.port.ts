import { type Result } from '@shared/result/result.type';
import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';
import { type LedgerEntry } from './ledger-entry.interface';
import { type RecordedMovement } from './recorded-movement.interface';

export abstract class StockLedger {
  abstract record(entry: LedgerEntry): Promise<Result<RecordedMovement, RecordEntryError>>;
}
