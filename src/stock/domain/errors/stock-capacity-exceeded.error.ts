export class StockCapacityExceeded {
  readonly kind = 'StockCapacityExceeded';

  private constructor(
    readonly sku: string,
    readonly requested: number,
    readonly onHand: number,
    readonly capacity: number,
  ) {}

  static make(
    sku: string,
    requested: number,
    onHand: number,
    capacity: number,
  ): StockCapacityExceeded {
    return new StockCapacityExceeded(sku, requested, onHand, capacity);
  }
}
