import { InvariantViolated } from '../../utils/invariant-violated';
import { Err, Ok, type Result } from '../../utils/result';

export const MAX_MOVEMENT_QUANTITY = 100_000;

export class Quantity {
  private constructor(readonly value: number) {}

  static make(raw: number): Result<Quantity, InvariantViolated> {
    if (!Number.isSafeInteger(raw) || raw < 1 || raw > MAX_MOVEMENT_QUANTITY) {
      return Err.make(
        InvariantViolated.make(
          'quantity',
          `must be an integer between 1 and ${MAX_MOVEMENT_QUANTITY}`,
        ),
      );
    }

    return Ok.make(new Quantity(raw));
  }
}
