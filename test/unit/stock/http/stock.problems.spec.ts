import { ProblemException } from '@shared/http/problem';
import { StockProblems } from '@stock/http/stock.problems';
import {
  IdempotencyKeyReused,
  InsufficientStock,
  StockCapacityExceeded,
  VariantNotFound,
} from '@stock/domain/stock.errors';
import { InvariantViolated } from '@shared/invariant-violated';
import { IDEMPOTENCY_KEY, SNEAKER_SKU } from '@test/fixtures/stock.fixtures';

describe('HTTP problems for stock outcomes', () => {
  it('translates a violated invariant into 400 naming the field', () => {
    const problem = ProblemException.invariantViolated(
      InvariantViolated.make('quantity', 'must be positive'),
    ).problem;

    expect(problem).toMatchObject({
      status: 400,
      code: 'InvariantViolated',
      detail: 'must be positive',
      field: 'quantity',
    });
  });

  it('translates an unknown variant into 404', () => {
    expect(StockProblems.variantNotFound(VariantNotFound.make(SNEAKER_SKU)).problem).toMatchObject({
      status: 404,
      code: 'VariantNotFound',
      detail: `Variant ${SNEAKER_SKU} not found`,
    });
  });

  it('translates insufficient stock into 409 with what is available', () => {
    const error = InsufficientStock.make(SNEAKER_SKU, 5, 2);

    expect(StockProblems.insufficientStock(error).problem).toMatchObject({
      status: 409,
      code: 'InsufficientStock',
      requested: 5,
      available: 2,
    });
  });

  it('translates an exceeded capacity into 409 with the capacity', () => {
    const error = StockCapacityExceeded.make(SNEAKER_SKU, 10, 95, 100);

    expect(StockProblems.stockCapacityExceeded(error).problem).toMatchObject({
      status: 409,
      code: 'StockCapacityExceeded',
      requested: 10,
      onHand: 95,
      capacity: 100,
    });
  });

  it('translates a reused idempotency key into 422', () => {
    const error = IdempotencyKeyReused.make(IDEMPOTENCY_KEY);

    expect(StockProblems.idempotencyKeyReused(error).problem).toMatchObject({
      status: 422,
      code: 'IdempotencyKeyReused',
    });
  });
});
