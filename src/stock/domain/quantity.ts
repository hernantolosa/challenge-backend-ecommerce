import { InvariantViolated } from '@shared/invariant-violated';
import { Err, Ok, type Result } from '@shared/result';
import {
  MAX_MOVEMENT_QUANTITY,
  MIN_MOVEMENT_QUANTITY,
  QUANTITY_RANGE_MESSAGE,
} from './stock.constants';

export class Quantity {
  private constructor(readonly value: number) {}

  static make(raw: number): Result<Quantity, InvariantViolated> {
    if (!Number.isSafeInteger(raw) || raw < MIN_MOVEMENT_QUANTITY || raw > MAX_MOVEMENT_QUANTITY) {
      return Err.make(InvariantViolated.make('quantity', QUANTITY_RANGE_MESSAGE));
    }

    return Ok.make(new Quantity(raw));
  }
}
