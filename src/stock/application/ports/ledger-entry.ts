import { type IdempotencyKey } from '@stock/domain/idempotency-key';
import { type StockAdjustment } from '@stock/domain/stock-adjustment';

export interface LedgerEntry {
  readonly adjustment: StockAdjustment;
  readonly actor: string;
  readonly idempotencyKey: IdempotencyKey;
}
