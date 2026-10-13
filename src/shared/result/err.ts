import { type Failure } from './failure.interface';

export class Err<E extends Failure> {
  readonly kind: E['kind'];

  private constructor(readonly error: E) {
    this.kind = error.kind;
  }

  static make<E extends Failure>(error: E): Err<E> {
    return new Err(error);
  }
}
