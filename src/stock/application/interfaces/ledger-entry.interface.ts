import { type StockAdjustment } from '@stock/domain/value-objects/stock-adjustment';
import { type IdempotencyKey } from '@stock/domain/value-objects/idempotency-key';

export interface LedgerEntry {
  readonly adjustment: StockAdjustment;
  readonly actor: string;
  readonly idempotencyKey: IdempotencyKey;
}
