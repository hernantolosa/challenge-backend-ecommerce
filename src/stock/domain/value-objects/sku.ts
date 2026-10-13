import {
  SKU_FORMAT_MESSAGE,
  SKU_LENGTH_MESSAGE,
  SKU_MAX_LENGTH,
  SKU_PATTERN,
} from '@shared-kernel/constants/sku.constants';
import { InvariantViolated } from '@utils/errors/invariant-violated.error';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';

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
