import { type MovementReason } from '../../domain/movement-reason';
import { type StockMovement } from '../../domain/stock-movement';

export interface StockMovementView {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly balanceAfter: number;
  readonly occurredAt: Date;
}

export function toStockMovementView(movement: StockMovement): StockMovementView {
  return {
    id: movement.id,
    sku: movement.sku,
    quantity: movement.quantity,
    reason: movement.reason,
    balanceAfter: movement.balanceAfter,
    occurredAt: movement.occurredAt,
  };
}
