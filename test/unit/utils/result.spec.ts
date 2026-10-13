import { InvariantViolated } from '../../../src/utils/errors/invariant-violated.error';
import { exhaustiveMatchGuard } from '../../../src/utils/exhaustive-match-guard';
import { Err } from '../../../src/utils/result/err';
import { Ok } from '../../../src/utils/result/ok';
import { type Result } from '../../../src/utils/result/result';

class NotFound {
  readonly kind = 'NotFound';
}

function describeOutcome(result: Result<number, InvariantViolated | NotFound>): string {
  switch (result.kind) {
    case 'Ok':
      return `value ${result.value}`;
    case 'InvariantViolated':
      return `invalid ${result.error.field}`;
    case 'NotFound':
      return 'not found';
    default:
      return exhaustiveMatchGuard(result);
  }
}

describe('Result', () => {
  it('wraps a value as an Ok outcome', () => {
    const result = Ok.make(42);

    expect(result).toEqual({ kind: 'Ok', value: 42 });
    expect(describeOutcome(result)).toBe('value 42');
  });

  it('exposes the kind of the wrapped error so a single switch can match it', () => {
    const result = Err.make(InvariantViolated.make('quantity', 'must be positive'));

    expect(result).toEqual({
      kind: 'InvariantViolated',
      error: { kind: 'InvariantViolated', field: 'quantity', message: 'must be positive' },
    });
    expect(describeOutcome(result)).toBe('invalid quantity');
  });

  it('matches every error kind of the union', () => {
    expect(describeOutcome(Err.make(new NotFound()))).toBe('not found');
  });
});

describe('exhaustiveMatchGuard', () => {
  it('fails loudly when an unexpected case reaches an exhaustive switch', () => {
    const unexpected = { kind: 'Unknown' } as never;

    expect(() => exhaustiveMatchGuard(unexpected)).toThrow('Unhandled case: {"kind":"Unknown"}');
  });
});
