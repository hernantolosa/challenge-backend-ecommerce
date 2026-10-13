import { type StockLevel } from '../../domain/interfaces/stock-level.interface';
import { type StockLevelView } from '../dto/stock-level.view';

export function toStockLevelView(level: StockLevel): StockLevelView {
  return { sku: level.sku, onHand: level.onHand };
}
