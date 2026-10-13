export class Ok<T> {
  readonly ok = true;

  private constructor(readonly value: T) {}

  static make<T>(value: T): Ok<T> {
    return new Ok(value);
  }
}
