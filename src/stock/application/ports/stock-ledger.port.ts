import { type Result } from '@shared/result/result.type';
import { type IdempotencyKey } from '@stock/domain/value-objects/idempotency-key.value-object';
import { type StockMovement } from '@stock/domain/entities/stock-movement.entity';
import { type LedgerEntry } from './ledger-entry.interface';
import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';

export abstract class StockLedger {
  abstract record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>>;

  abstract findMovement(
    createdBy: string,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null>;
}
