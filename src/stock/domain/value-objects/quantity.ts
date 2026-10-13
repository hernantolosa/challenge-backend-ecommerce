import {
  MAX_MOVEMENT_QUANTITY,
  MIN_MOVEMENT_QUANTITY,
  QUANTITY_RANGE_MESSAGE,
} from '@stock/domain/constants/quantity.constants';
import { InvariantViolated } from '@utils/errors/invariant-violated.error';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';

export class Quantity {
  private constructor(readonly value: number) {}

  static make(raw: number): Result<Quantity, InvariantViolated> {
    if (!Number.isSafeInteger(raw) || raw < MIN_MOVEMENT_QUANTITY || raw > MAX_MOVEMENT_QUANTITY) {
      return Err.make(InvariantViolated.make('quantity', QUANTITY_RANGE_MESSAGE));
    }

    return Ok.make(new Quantity(raw));
  }
}
