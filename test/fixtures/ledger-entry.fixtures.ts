import { unwrap } from '@test/support/unwrap';
import { randomUUID } from 'node:crypto';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry';
import { IdempotencyKey } from '@stock/domain/idempotency-key';
import { MovementReason } from '@stock/domain/movement-reason';
import { StockAdjustment } from '@stock/domain/stock-adjustment';
import { ACTOR, SNEAKER_SKU } from './stock.fixtures';

export interface LedgerEntrySeed {
  readonly sku?: string;
  readonly quantity?: number;
  readonly reason?: MovementReason;
  readonly actor?: string;
  readonly idempotencyKey?: string;
}

export function aLedgerEntry(seed: LedgerEntrySeed = {}): LedgerEntry {
  const adjustment = StockAdjustment.make(
    seed.sku ?? SNEAKER_SKU,
    seed.quantity ?? 1,
    seed.reason ?? MovementReason.SALE,
  );
  const idempotencyKey = IdempotencyKey.make(seed.idempotencyKey ?? randomUUID());

  return {
    adjustment: unwrap(adjustment),
    actor: seed.actor ?? ACTOR,
    idempotencyKey: unwrap(idempotencyKey),
  };
}
