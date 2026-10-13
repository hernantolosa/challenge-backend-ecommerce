import { unwrap } from '@test/support/unwrap';
import { randomUUID } from 'node:crypto';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { IdempotencyKey } from '@stock/domain/value-objects/idempotency-key';
import { MovementReason } from '@stock/domain/enums/movement-reason';
import { StockAdjustment } from '@stock/domain/value-objects/stock-adjustment';
import { type LedgerEntrySeed } from '@test/fixtures/interfaces/ledger-entry-seed.interface';
import { ACTOR, SNEAKER_SKU } from './stock.fixtures';

export function aLedgerEntry(seed: LedgerEntrySeed = {}): LedgerEntry {
  const adjustment = StockAdjustment.make({
    sku: seed.sku ?? SNEAKER_SKU,
    quantity: seed.quantity ?? 1,
    reason: seed.reason ?? MovementReason.SALE,
  });
  const idempotencyKey = IdempotencyKey.make(seed.idempotencyKey ?? randomUUID());

  return {
    adjustment: unwrap(adjustment),
    actor: seed.actor ?? ACTOR,
    idempotencyKey: unwrap(idempotencyKey),
  };
}
