import { InvariantViolated } from '@shared/errors/invariant-violated.error';
import { Err } from '@shared/result/err';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result.type';
import {
  MAX_MOVEMENT_QUANTITY,
  MIN_MOVEMENT_QUANTITY,
  QUANTITY_RANGE_MESSAGE,
} from '@stock/domain/constants/stock.constants';

export class Quantity {
  private constructor(readonly value: number) {}

  static make(raw: number): Result<Quantity, InvariantViolated> {
    if (!Number.isSafeInteger(raw) || raw < MIN_MOVEMENT_QUANTITY || raw > MAX_MOVEMENT_QUANTITY) {
      return Err.make(InvariantViolated.make('quantity', QUANTITY_RANGE_MESSAGE));
    }

    return Ok.make(new Quantity(raw));
  }
}
