import { type StockLevelRow } from '@stock/adapters/outbound/persistence/rows/stock-level.row';
import { type StockLevel } from '@stock/domain/interfaces/stock-level.interface';

export function toStockLevel(row: StockLevelRow): StockLevel {
  return { sku: row.sku, onHand: row.onHand };
}
