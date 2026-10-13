export class InvariantViolated {
  readonly kind = 'InvariantViolated';

  private constructor(
    readonly field: string,
    readonly message: string,
  ) {}

  static make(field: string, message: string): InvariantViolated {
    return new InvariantViolated(field, message);
  }
}
