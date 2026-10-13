import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type AppliedAdjustmentRow } from '@stock/adapters/outbound/persistence/rows/applied-adjustment.row';

export function toStockMovementFromAppliedRow(
  entry: LedgerEntry,
  applied: AppliedAdjustmentRow,
): StockMovement {
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
