import { InvariantViolated } from '../../../src/utils/errors/invariant-violated.error';
import { exhaustiveMatchGuard } from '../../../src/utils/exhaustive-match-guard';
import { Err } from '../../../src/utils/result/err';
import { Ok } from '../../../src/utils/result/ok';
import { type Result } from '../../../src/utils/result/result';

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

describe('exhaustiveMatchGuard', () => {
  it('fails loudly when an unexpected case reaches an exhaustive switch', () => {
    const unexpected = { kind: 'Unknown' } as never;

    expect(() => exhaustiveMatchGuard(unexpected)).toThrow('Unhandled case: {"kind":"Unknown"}');
  });
});
