import { type StockLevelView } from '../../../../application/dto/stock-level.view';

export class StockLevelResponse {
  private constructor(
    readonly sku: string,
    readonly onHand: number,
  ) {}

  static from(view: StockLevelView): StockLevelResponse {
    return new StockLevelResponse(view.sku, view.onHand);
  }
}
