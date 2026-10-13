import { type Result } from '@shared/result';
import { type IdempotencyKey } from '@stock/domain/idempotency-key';
import { type Sku } from '@stock/domain/sku';
import { type StockAdjustment } from '@stock/domain/stock-adjustment';
import {
  type InsufficientStock,
  type StockCapacityExceeded,
  type VariantNotFound,
} from '@stock/domain/stock.errors';
import { type StockLevel, type StockMovement } from '@stock/domain/stock-movement';

export interface LedgerEntry {
  readonly adjustment: StockAdjustment;
  readonly actor: string;
  readonly idempotencyKey: IdempotencyKey;
}

export class IdempotencyKeyTaken {
  readonly kind = 'IdempotencyKeyTaken';

  static make(): IdempotencyKeyTaken {
    return new IdempotencyKeyTaken();
  }
}

export type RecordEntryError =
  | VariantNotFound
  | InsufficientStock
  | StockCapacityExceeded
  | IdempotencyKeyTaken;

export abstract class StockLedger {
  abstract record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>>;

  abstract findMovement(
    actor: string,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null>;
}

export abstract class StockLevelReader {
  abstract findLevel(sku: Sku): Promise<StockLevel | null>;
}
