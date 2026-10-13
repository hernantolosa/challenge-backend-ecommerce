import { type Result } from '@shared/result/result';
import { type IdempotencyKey } from '@stock/domain/idempotency-key';
import { type StockMovement } from '@stock/domain/stock-movement';
import { type LedgerEntry } from './ledger-entry';
import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';

export abstract class StockLedger {
  abstract record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>>;

  abstract findMovement(
    actor: string,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null>;
}
