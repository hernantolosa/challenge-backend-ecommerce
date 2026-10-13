import { type StockAdjustment } from '../../domain/stock-adjustment';
import { type IdempotencyKey } from '../../domain/value-objects/idempotency-key';

export interface LedgerEntry {
  readonly adjustment: StockAdjustment;
  readonly actor: string;
  readonly idempotencyKey: IdempotencyKey;
}
