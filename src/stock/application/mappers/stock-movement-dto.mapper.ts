import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type StockMovementDto } from '@stock/application/dto/stock-movement.dto';

export function toStockMovementDto(movement: StockMovement): StockMovementDto {
  return {
    id: movement.id,
    sku: movement.sku,
    quantity: movement.quantity,
    reason: movement.reason,
    balanceAfter: movement.balanceAfter,
    occurredAt: movement.occurredAt,
  };
}
