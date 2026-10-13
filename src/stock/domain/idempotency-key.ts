import { InvariantViolated } from '../../utils/invariant-violated';
import { Err, Ok, type Result } from '../../utils/result';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class IdempotencyKey {
  private constructor(readonly value: string) {}

  static make(raw: string): Result<IdempotencyKey, InvariantViolated> {
    const normalized = raw.trim().toLowerCase();

    if (!UUID_PATTERN.test(normalized)) {
      return Err.make(InvariantViolated.make('idempotencyKey', 'must be a valid UUID'));
    }

    return Ok.make(new IdempotencyKey(normalized));
  }
}
