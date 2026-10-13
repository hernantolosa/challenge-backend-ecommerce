import { type IdempotencyKey } from '../../domain/value-objects/idempotency-key';
import { type StockMovement } from '../../domain/interfaces/stock-movement.interface';
import { type Result } from '../../../utils/result/types/result.type';
import { type RecordEntryError } from '../errors/record-entry.error';
import { type LedgerEntry } from '../interfaces/ledger-entry.interface';

export abstract class StockLedger {
  abstract record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>>;

  abstract findMovement(
    actor: string,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null>;
}
