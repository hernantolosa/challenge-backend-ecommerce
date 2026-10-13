import { type StockLevelResponseDto } from '@stock/adapters/http/dto/stock-level-response.dto';
import { type StockMovementResponseDto } from '@stock/adapters/http/dto/stock-movement-response.dto';
import { type StockLevel } from '@stock/domain/entities/stock-level.entity';
import { type StockMovement } from '@stock/domain/entities/stock-movement.entity';

export function toStockMovementResponseDto(movement: StockMovement): StockMovementResponseDto {
  return {
    id: movement.id,
    sku: movement.sku,
    quantity: movement.quantity,
    reason: movement.reason,
    balanceAfter: movement.balanceAfter,
    occurredAt: movement.occurredAt.toISOString(),
  };
}

export function toStockLevelResponseDto(level: StockLevel): StockLevelResponseDto {
  return { sku: level.sku, onHand: level.onHand };
}
