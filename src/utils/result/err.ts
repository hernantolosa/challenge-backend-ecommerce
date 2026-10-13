export class Err<E> {
  readonly ok = false;

  private constructor(readonly error: E) {}

  static make<E>(error: E): Err<E> {
    return new Err(error);
  }
}
