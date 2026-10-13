export class IdempotencyKeyTaken {
  readonly kind = 'IdempotencyKeyTaken';

  static make(): IdempotencyKeyTaken {
    return new IdempotencyKeyTaken();
  }
}
