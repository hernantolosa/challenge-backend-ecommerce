import {
  IDEMPOTENCY_KEY_FORMAT_MESSAGE,
  UUID_PATTERN,
} from '@stock/domain/constants/idempotency-key.constants';
import { InvariantViolated } from '@utils/errors/invariant-violated.error';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';

export class IdempotencyKey {
  private constructor(readonly value: string) {}

  static make(raw: string): Result<IdempotencyKey, InvariantViolated> {
    const normalized = raw.trim().toLowerCase();

    if (!UUID_PATTERN.test(normalized)) {
      return Err.make(InvariantViolated.make('idempotencyKey', IDEMPOTENCY_KEY_FORMAT_MESSAGE));
    }

    return Ok.make(new IdempotencyKey(normalized));
  }
}
