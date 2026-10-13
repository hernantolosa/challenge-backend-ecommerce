import { type Sku } from '@stock/domain/value-objects/sku.value-object';
import { type StockLevel } from '@stock/domain/entities/stock-level.entity';

export abstract class StockLevelReader {
  abstract findLevel(sku: Sku): Promise<StockLevel | null>;
}
