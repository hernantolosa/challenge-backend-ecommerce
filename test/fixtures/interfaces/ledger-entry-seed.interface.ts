import { type MovementReason } from '@stock/domain/enums/movement-reason';

export interface LedgerEntrySeed {
  readonly sku?: string;
  readonly quantity?: number;
  readonly reason?: MovementReason;
  readonly actor?: string;
  readonly idempotencyKey?: string;
}
