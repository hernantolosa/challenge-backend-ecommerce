import { type LedgerEntry } from '../../../application/ports/ledger-entry.interface';
import { type StockMovement } from '../../../domain/interfaces/stock-movement.interface';
import { type AppliedAdjustmentRow } from './applied-adjustment.row';

export function toStockMovement(entry: LedgerEntry, applied: AppliedAdjustmentRow): StockMovement {
  return {
    id: applied.id,
    sku: entry.adjustment.sku.value,
    quantity: entry.adjustment.quantity.value,
    reason: entry.adjustment.reason,
    balanceAfter: applied.balanceAfter,
    actor: entry.actor,
    idempotencyKey: entry.idempotencyKey.value,
    occurredAt: applied.occurredAt,
  };
}
