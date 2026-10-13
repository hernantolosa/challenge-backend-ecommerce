import { type InvariantViolated } from '@shared/invariant-violated';
import { Err, exhaustiveMatchGuard, Ok, type Result } from '@shared/result';
import { Sku } from '@stock/domain/sku';
import { VariantNotFound } from '@stock/domain/stock.errors';
import { type StockLevel } from '@stock/domain/stock-movement';
import { type StockLevelReader } from './stock-ledger.port';

export interface GetStockLevelInput {
  readonly sku: string;
}

export type GetStockLevelError = InvariantViolated | VariantNotFound;

export class GetStockLevel {
  constructor(private readonly levels: StockLevelReader) {}

  async execute(input: GetStockLevelInput): Promise<Result<StockLevel, GetStockLevelError>> {
    const sku = Sku.make(input.sku);

    switch (sku.kind) {
      case 'Ok':
        return this.findStockLevel(sku.value);
      case 'InvariantViolated':
        return sku;
      default:
        return exhaustiveMatchGuard(sku);
    }
  }

  private async findStockLevel(sku: Sku): Promise<Result<StockLevel, GetStockLevelError>> {
    const level = await this.levels.findLevel(sku);
    if (level === null) return Err.make(VariantNotFound.make(sku.value));

    return Ok.make(level);
  }
}
