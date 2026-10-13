import { unwrap } from '@test/support/unwrap';
import { randomUUID } from 'node:crypto';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry.interface';
import { IdempotencyKey } from '@stock/domain/value-objects/idempotency-key.value-object';
import { MovementReason } from '@stock/domain/enums/movement-reason.enum';
import { StockAdjustment } from '@stock/domain/value-objects/stock-adjustment.value-object';
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
