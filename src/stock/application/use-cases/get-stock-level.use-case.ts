import { Sku } from '../../domain/sku';
import { VariantNotFound } from '../../domain/stock.errors';
import { type InvariantViolated } from '../../../utils/invariant-violated';
import { Err, Ok, type Result } from '../../../utils/result';
import { toStockLevelView, type StockLevelView } from '../dto/stock-level.view';
import { type StockLedger } from '../ports/stock-ledger.port';

export type GetStockLevelError = InvariantViolated | VariantNotFound;

export class GetStockLevel {
  constructor(private readonly ledger: StockLedger) {}

  async execute(rawSku: string): Promise<Result<StockLevelView, GetStockLevelError>> {
    const sku = Sku.make(rawSku);
    if (!sku.ok) return sku;

    const level = await this.ledger.findLevel(sku.value);
    if (level === null) return Err.make(VariantNotFound.make(sku.value.value));

    return Ok.make(toStockLevelView(level));
  }
}
