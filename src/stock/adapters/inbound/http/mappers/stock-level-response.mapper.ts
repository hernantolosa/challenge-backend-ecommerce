import { type StockLevelDto } from '@stock/application/dto/stock-level.dto';
import { type StockLevelResponseDto } from '@stock/adapters/inbound/http/responses/stock-level-response.dto';

export function toStockLevelResponseDto(level: StockLevelDto): StockLevelResponseDto {
  return { sku: level.sku, onHand: level.onHand };
}
