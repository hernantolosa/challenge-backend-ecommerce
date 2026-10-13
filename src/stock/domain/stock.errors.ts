export interface VariantNotFound {
  readonly kind: 'VariantNotFound';
  readonly sku: string;
}

export const VariantNotFound = {
  make(sku: string): VariantNotFound {
    return { kind: 'VariantNotFound', sku };
  },
};

export interface InsufficientStock {
  readonly kind: 'InsufficientStock';
  readonly sku: string;
  readonly requested: number;
  readonly available: number;
}

export const InsufficientStock = {
  make(sku: string, requested: number, available: number): InsufficientStock {
    return { kind: 'InsufficientStock', sku, requested, available };
  },
};

export interface IdempotencyKeyReused {
  readonly kind: 'IdempotencyKeyReused';
  readonly idempotencyKey: string;
}

export const IdempotencyKeyReused = {
  make(idempotencyKey: string): IdempotencyKeyReused {
    return { kind: 'IdempotencyKeyReused', idempotencyKey };
  },
};
