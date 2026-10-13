import { type IdempotencyKey } from '@stock/domain/value-objects/idempotency-key';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type Result } from '@utils/result/types/result.type';
import { type RecordEntryError } from '@stock/application/errors/record-entry.error';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';

export abstract class StockLedger {
  abstract record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>>;

  abstract findMovement(
    actor: string,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null>;
}
