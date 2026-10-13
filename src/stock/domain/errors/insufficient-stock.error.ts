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
