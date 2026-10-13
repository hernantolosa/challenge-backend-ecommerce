import { VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { Sku } from '@stock/domain/value-objects/sku';
import { exhaustiveMatchGuard } from '@utils/exhaustive-match-guard';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';
import { type GetStockLevelInputDto } from '@stock/application/dto/get-stock-level-input.dto';
import { type StockLevelDto } from '@stock/application/dto/stock-level.dto';
import { type GetStockLevelError } from '@stock/application/errors/get-stock-level.error';
import { toStockLevelDto } from '@stock/application/mappers/stock-level-dto.mapper';
import { type StockLevelReader } from '@stock/application/ports/stock-level-reader.port';

export class GetStockLevel {
  constructor(private readonly levels: StockLevelReader) {}

  async execute(input: GetStockLevelInputDto): Promise<Result<StockLevelDto, GetStockLevelError>> {
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

  private async findStockLevel(sku: Sku): Promise<Result<StockLevelDto, GetStockLevelError>> {
    const level = await this.levels.findLevel(sku);
    if (level === null) return Err.make(VariantNotFound.make(sku.value));

    return Ok.make(toStockLevelDto(level));
  }
}
