import { VariantNotFound } from '../../domain/errors/variant-not-found.error';
import { Sku } from '../../domain/value-objects/sku';
import { Err } from '../../../utils/result/err';
import { Ok } from '../../../utils/result/ok';
import { type Result } from '../../../utils/result/result';
import { type StockLevelView } from '../dto/stock-level.view';
import { type GetStockLevelError } from '../errors/get-stock-level.error';
import { toStockLevelView } from '../mappers/stock-level-view.mapper';
import { type StockLevelReader } from '../ports/stock-level-reader.port';

export class GetStockLevel {
  constructor(private readonly levels: StockLevelReader) {}

  async execute(rawSku: string): Promise<Result<StockLevelView, GetStockLevelError>> {
    const sku = Sku.make(rawSku);
    if (!sku.ok) return sku;

    const level = await this.levels.findLevel(sku.value);
    if (level === null) return Err.make(VariantNotFound.make(sku.value.value));

    return Ok.make(toStockLevelView(level));
  }
}
