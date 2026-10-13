import { Err } from '@shared/result/err';
import { exhaustiveMatchGuard } from '@shared/result/match';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result';
import { type GetStockLevelError } from '@stock/application/errors/get-stock-level.errors';
import { type GetStockLevelInputDto } from '@stock/application/dto/get-stock-level-input.dto';
import { type StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { Sku } from '@stock/domain/sku';
import { type StockLevel } from '@stock/domain/stock-level';

export class GetStockLevel {
  constructor(private readonly levels: StockLevelReader) {}

  async execute(input: GetStockLevelInputDto): Promise<Result<StockLevel, GetStockLevelError>> {
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
