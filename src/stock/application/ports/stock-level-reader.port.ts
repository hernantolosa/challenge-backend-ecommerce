import { type Sku } from '@stock/domain/sku';
import { type StockLevel } from '@stock/domain/stock-level';

export abstract class StockLevelReader {
  abstract findLevel(sku: Sku): Promise<StockLevel | null>;
}
