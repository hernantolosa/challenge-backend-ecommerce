export class VariantNotFound {
  readonly kind = 'VariantNotFound';

  private constructor(readonly sku: string) {}

  static make(sku: string): VariantNotFound {
    return new VariantNotFound(sku);
  }
}
