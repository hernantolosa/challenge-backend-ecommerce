import { type StockMovement } from '../../domain/interfaces/stock-movement.interface';
import { type StockMovementView } from '../dto/stock-movement.view';

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
