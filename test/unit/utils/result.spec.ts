import { assertNever } from '../../../src/utils/assert-never';
import { InvariantViolated } from '../../../src/utils/invariant-violated';
import { Err, Ok, type Result } from '../../../src/utils/result';

function describeOutcome(result: Result<number, InvariantViolated>): string {
  return result.ok ? `value ${result.value}` : `error on ${result.error.field}`;
}

describe('Result', () => {
  it('wraps a value as a successful outcome', () => {
    const result = Ok.make(42);

    expect(result).toEqual({ ok: true, value: 42 });
    expect(describeOutcome(result)).toBe('value 42');
  });

  it('wraps an error as a failed outcome', () => {
    const result = Err.make(InvariantViolated.make('quantity', 'must be positive'));

    expect(result).toEqual({
      ok: false,
      error: { kind: 'InvariantViolated', field: 'quantity', message: 'must be positive' },
    });
    expect(describeOutcome(result)).toBe('error on quantity');
  });
});

describe('assertNever', () => {
  it('fails loudly when an unexpected variant reaches an exhaustive switch', () => {
    const unexpected = { kind: 'Unknown' } as never;

    expect(() => assertNever(unexpected)).toThrow('Unhandled variant: {"kind":"Unknown"}');
  });
});
