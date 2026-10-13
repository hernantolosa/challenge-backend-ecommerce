import { InvariantViolated } from '@shared/invariant-violated';
import { Err, Ok, type Result } from '@shared/result';
import { IDEMPOTENCY_KEY_FORMAT_MESSAGE, UUID_PATTERN } from './stock.constants';

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
