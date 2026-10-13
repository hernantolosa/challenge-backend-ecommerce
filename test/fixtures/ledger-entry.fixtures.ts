import { randomUUID } from 'node:crypto';
import { type LedgerEntry } from '../../src/stock/application/ports/ledger-entry.interface';
import { IdempotencyKey } from '../../src/stock/domain/value-objects/idempotency-key';
import { MovementReason } from '../../src/stock/domain/movement-reason';
import { StockAdjustment } from '../../src/stock/domain/stock-adjustment';
import { ACTOR, SNEAKER_SKU } from './stock.fixtures';

export interface LedgerEntrySeed {
  readonly sku?: string;
  readonly quantity?: number;
  readonly reason?: MovementReason;
  readonly actor?: string;
  readonly idempotencyKey?: string;
}

export function aLedgerEntry(seed: LedgerEntrySeed = {}): LedgerEntry {
  const adjustment = StockAdjustment.make({
    sku: seed.sku ?? SNEAKER_SKU,
    quantity: seed.quantity ?? 1,
    reason: seed.reason ?? MovementReason.SALE,
  });
  const idempotencyKey = IdempotencyKey.make(seed.idempotencyKey ?? randomUUID());

  if (!adjustment.ok || !idempotencyKey.ok) throw new Error('Invalid ledger entry fixture');

  return {
    adjustment: adjustment.value,
    actor: seed.actor ?? ACTOR,
    idempotencyKey: idempotencyKey.value,
  };
}
