import { type StockMovementDto } from '@stock/application/dto/stock-movement.dto';
import { type StockMovementResponseDto } from '@stock/adapters/inbound/http/responses/stock-movement-response.dto';

export function toStockMovementResponseDto(movement: StockMovementDto): StockMovementResponseDto {
  return {
    id: movement.id,
    sku: movement.sku,
    quantity: movement.quantity,
    reason: movement.reason,
    balanceAfter: movement.balanceAfter,
    occurredAt: movement.occurredAt.toISOString(),
  };
}
