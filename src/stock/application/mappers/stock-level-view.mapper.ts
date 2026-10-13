import { type StockLevel } from '@stock/domain/interfaces/stock-level.interface';
import { type StockLevelView } from '@stock/application/dto/stock-level.view';

export function toStockLevelView(level: StockLevel): StockLevelView {
  return { sku: level.sku, onHand: level.onHand };
}
