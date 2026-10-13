import { type StockLevel } from '../../domain/stock-level';

export interface StockLevelView {
  readonly sku: string;
  readonly onHand: number;
}

export function toStockLevelView(level: StockLevel): StockLevelView {
  return { sku: level.sku, onHand: level.onHand };
}
