import { InvariantViolated } from '../../../utils/errors/invariant-violated.error';
import { Err } from '../../../utils/result/err';
import { Ok } from '../../../utils/result/ok';
import { type Result } from '../../../utils/result/result';

export const SKU_MAX_LENGTH = 64;
const SKU_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

export class Sku {
  private constructor(readonly value: string) {}

  static make(raw: string): Result<Sku, InvariantViolated> {
    const normalized = raw.trim().toUpperCase();

    if (normalized.length === 0 || normalized.length > SKU_MAX_LENGTH) {
      return Err.make(
        InvariantViolated.make('sku', `must have between 1 and ${SKU_MAX_LENGTH} characters`),
      );
    }

    if (!SKU_PATTERN.test(normalized)) {
      return Err.make(
        InvariantViolated.make('sku', 'must contain only letters, digits and single hyphens'),
      );
    }

    return Ok.make(new Sku(normalized));
  }
}
