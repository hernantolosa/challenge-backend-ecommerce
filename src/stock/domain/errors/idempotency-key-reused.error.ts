export class IdempotencyKeyReused {
  readonly kind = 'IdempotencyKeyReused';

  private constructor(readonly idempotencyKey: string) {}

  static make(idempotencyKey: string): IdempotencyKeyReused {
    return new IdempotencyKeyReused(idempotencyKey);
  }
}
