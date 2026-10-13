import { type StockLevel } from '../../domain/interfaces/stock-level.interface';
import { type Sku } from '../../domain/value-objects/sku';

export abstract class StockLevelReader {
  abstract findLevel(sku: Sku): Promise<StockLevel | null>;
}
