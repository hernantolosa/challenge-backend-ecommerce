import { type AppliedAdjustmentRow } from '@stock/adapters/outbound/persistence/rows/applied-adjustment.row';
import { type StockMovementRow } from '@stock/adapters/outbound/persistence/rows/stock-movement.row';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type MovementReason } from '@stock/domain/enums/movement-reason';
import { isMovementReason } from '@stock/domain/guards/movement-reason.guard';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { unreachable } from '@utils/unreachable';

export function toStockMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    sku: row.sku,
    quantity: row.quantity,
    reason: storedReasonOf(row.reason),
    balanceAfter: row.balanceAfter,
    actor: row.actor,
    idempotencyKey: row.idempotencyKey,
    occurredAt: row.occurredAt,
  };
}

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

function storedReasonOf(reason: string): MovementReason {
  return isMovementReason(reason)
    ? reason
    : unreachable(`stored movement reason ${reason} is unknown`);
}
