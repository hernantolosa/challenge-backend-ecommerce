import { InvariantViolated } from '@shared/invariant-violated';
import { Err, Ok, type Result } from '@shared/result';
import {
  SKU_FORMAT_MESSAGE,
  SKU_LENGTH_MESSAGE,
  SKU_MAX_LENGTH,
  SKU_PATTERN,
} from './stock.constants';

export class Sku {
  private constructor(readonly value: string) {}

  static make(raw: string): Result<Sku, InvariantViolated> {
    const normalized = raw.trim().toUpperCase();

    if (normalized.length === 0 || normalized.length > SKU_MAX_LENGTH) {
      return Err.make(InvariantViolated.make('sku', SKU_LENGTH_MESSAGE));
    }
    if (!SKU_PATTERN.test(normalized)) {
      return Err.make(InvariantViolated.make('sku', SKU_FORMAT_MESSAGE));
    }

    return Ok.make(new Sku(normalized));
  }
}
