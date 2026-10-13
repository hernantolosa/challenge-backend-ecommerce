import { unwrap } from '@test/support/unwrap';
import { MAX_MOVEMENT_QUANTITY } from '@stock/domain/constants/quantity.constants';
import { Quantity } from '@stock/domain/value-objects/quantity';

describe('Quantity', () => {
  it.each([1, 7, MAX_MOVEMENT_QUANTITY])('accepts %p units', (raw) => {
    const result = Quantity.make(raw);

    expect(unwrap(result).value).toBe(raw);
  });

  it.each([
    ['zero', 0],
    ['negative', -3],
    ['fractional', 1.5],
    ['above the maximum', MAX_MOVEMENT_QUANTITY + 1],
    ['not a number', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 2],
  ])('rejects a %s quantity', (_case, raw) => {
    expect(Quantity.make(raw)).toEqual({
      kind: 'InvariantViolated',
      error: {
        kind: 'InvariantViolated',
        field: 'quantity',
        message: `must be an integer between 1 and ${MAX_MOVEMENT_QUANTITY}`,
      },
    });
  });
});
