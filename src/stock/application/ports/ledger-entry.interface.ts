import { type IdempotencyKey } from '@stock/domain/value-objects/idempotency-key.value-object';
import { type StockAdjustment } from '@stock/domain/value-objects/stock-adjustment.value-object';

export interface LedgerEntry {
  readonly adjustment: StockAdjustment;
  readonly createdBy: string;
  readonly idempotencyKey: IdempotencyKey;
}
