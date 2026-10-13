import { unwrap } from '../../../support/unwrap';
import { IdempotencyKey } from '../../../../src/stock/domain/value-objects/idempotency-key';
import { IDEMPOTENCY_KEY } from '../../../fixtures/stock.fixtures';

describe('IdempotencyKey', () => {
  it('accepts a UUID', () => {
    const result = IdempotencyKey.make(IDEMPOTENCY_KEY);

    expect(unwrap(result).value).toBe(IDEMPOTENCY_KEY);
  });

  it('normalizes case and surrounding whitespace so retries match the same key', () => {
    const result = IdempotencyKey.make(`  ${IDEMPOTENCY_KEY.toUpperCase()} `);

    expect(unwrap(result).value).toBe(IDEMPOTENCY_KEY);
  });

  it.each([
    ['empty', ''],
    ['free text', 'retry-1'],
    ['missing segment', '3f0e2b4c-6d1a-4f8e-9b7c'],
    ['invalid variant', '3f0e2b4c-6d1a-4f8e-7b7c-2a5d8e1f4c60'],
    ['nil uuid', '00000000-0000-0000-0000-000000000000'],
  ])('rejects a %s key', (_case, raw) => {
    expect(IdempotencyKey.make(raw)).toEqual({
      kind: 'InvariantViolated',
      error: {
        kind: 'InvariantViolated',
        field: 'idempotencyKey',
        message: 'must be a valid UUID',
      },
    });
  });
});
