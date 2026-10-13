export interface Failure {
  readonly kind: string;
}

export class Ok<T> {
  readonly kind = 'Ok';

  private constructor(readonly value: T) {}

  static make<T>(value: T): Ok<T> {
    return new Ok(value);
  }
}

export class Err<E extends Failure> {
  readonly kind: E['kind'];

  private constructor(readonly error: E) {
    this.kind = error.kind;
  }

  static make<E extends Failure>(error: E): Err<E> {
    return new Err(error);
  }
}

export type Result<T, E extends Failure> = Ok<T> | (E extends Failure ? Err<E> : never);

export function exhaustiveMatchGuard(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function unreachable(reason: string): never {
  throw new Error(`Unreachable state: ${reason}`);
}
