import { type StockLevel } from '@stock/domain/interfaces/stock-level.interface';
import { type Sku } from '@stock/domain/value-objects/sku';

export abstract class StockLevelReader {
  abstract findLevel(sku: Sku): Promise<StockLevel | null>;
}
