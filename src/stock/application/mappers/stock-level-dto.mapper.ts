import { type StockLevel } from '@stock/domain/interfaces/stock-level.interface';
import { type StockLevelDto } from '@stock/application/dto/stock-level.dto';

export function toStockLevelDto(level: StockLevel): StockLevelDto {
  return { sku: level.sku, onHand: level.onHand };
}
