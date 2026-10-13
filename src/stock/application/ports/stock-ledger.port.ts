import { type IdempotencyKey } from '../../domain/idempotency-key';
import { type Sku } from '../../domain/sku';
import { type StockAdjustment } from '../../domain/stock-adjustment';
import { type StockLevel } from '../../domain/stock-level';
import { type StockMovement } from '../../domain/stock-movement';
import { type InsufficientStock, type VariantNotFound } from '../../domain/stock.errors';
import { type Result } from '../../../utils/result';

export interface LedgerEntry {
  readonly adjustment: StockAdjustment;
  readonly actor: string;
  readonly idempotencyKey: IdempotencyKey;
}

export interface IdempotencyKeyTaken {
  readonly kind: 'IdempotencyKeyTaken';
}

export const IdempotencyKeyTaken = {
  make(): IdempotencyKeyTaken {
    return { kind: 'IdempotencyKeyTaken' };
  },
};

export type RecordEntryError = VariantNotFound | InsufficientStock | IdempotencyKeyTaken;

export abstract class StockLedger {
  abstract record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>>;

  abstract findMovement(
    actor: string,
    idempotencyKey: IdempotencyKey,
  ): Promise<StockMovement | null>;

  abstract findLevel(sku: Sku): Promise<StockLevel | null>;
}
