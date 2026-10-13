export class VariantNotFound {
  readonly kind = 'VariantNotFound';

  private constructor(readonly sku: string) {}

  static make(sku: string): VariantNotFound {
    return new VariantNotFound(sku);
  }
}

export class InsufficientStock {
  readonly kind = 'InsufficientStock';

  private constructor(
    readonly sku: string,
    readonly requested: number,
    readonly available: number,
  ) {}

  static make(sku: string, requested: number, available: number): InsufficientStock {
    return new InsufficientStock(sku, requested, available);
  }
}

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

export class IdempotencyKeyReused {
  readonly kind = 'IdempotencyKeyReused';

  private constructor(readonly idempotencyKey: string) {}

  static make(idempotencyKey: string): IdempotencyKeyReused {
    return new IdempotencyKeyReused(idempotencyKey);
  }
}
