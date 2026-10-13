import { Sku, SKU_MAX_LENGTH } from '../../../../../src/stock/domain/value-objects/sku';
import { type Result } from '../../../../../src/utils/result/types/result.type';
import { type InvariantViolated } from '../../../../../src/utils/errors/invariant-violated.error';

function valueOf(result: Result<Sku, InvariantViolated>): string | undefined {
  return result.kind === 'Ok' ? result.value.value : undefined;
}

describe('Sku', () => {
  it.each([
    ['SNK-RUN-42-BLK', 'SNK-RUN-42-BLK'],
    ['snk-run-42-blk', 'SNK-RUN-42-BLK'],
    ['  SNK42  ', 'SNK42'],
    ['A', 'A'],
    ['A'.repeat(SKU_MAX_LENGTH), 'A'.repeat(SKU_MAX_LENGTH)],
  ])('accepts %p and normalizes it to %p', (raw, expected) => {
    expect(valueOf(Sku.make(raw))).toBe(expected);
  });

  it.each([
    ['empty', ''],
    ['blank', '   '],
    ['too long', 'A'.repeat(SKU_MAX_LENGTH + 1)],
  ])('rejects a %s value by length', (_case, raw) => {
    expect(Sku.make(raw)).toEqual({
      kind: 'InvariantViolated',
      error: {
        kind: 'InvariantViolated',
        field: 'sku',
        message: `must have between 1 and ${SKU_MAX_LENGTH} characters`,
      },
    });
  });

  it.each([
    ['leading hyphen', '-SNK'],
    ['trailing hyphen', 'SNK-'],
    ['double hyphen', 'SNK--42'],
    ['inner whitespace', 'SNK 42'],
    ['underscore', 'SNK_42'],
    ['sql injection attempt', "SNK'; DROP TABLE variants;--"],
    ['non ascii letter', 'ZAPATILLA-Ñ'],
  ])('rejects a value with %s', (_case, raw) => {
    expect(Sku.make(raw)).toEqual({
      kind: 'InvariantViolated',
      error: {
        kind: 'InvariantViolated',
        field: 'sku',
        message: 'must contain only letters, digits and single hyphens',
      },
    });
  });
});
