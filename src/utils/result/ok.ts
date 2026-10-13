export class Ok<T> {
  readonly kind = 'Ok';

  private constructor(readonly value: T) {}

  static make<T>(value: T): Ok<T> {
    return new Ok(value);
  }
}
