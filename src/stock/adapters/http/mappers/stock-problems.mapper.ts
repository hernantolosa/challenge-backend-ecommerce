import { ProblemException } from '@shared/http/problem.exception';
import { type IdempotencyKeyReused } from '@stock/domain/errors/idempotency-key-reused.error';
import { type InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { type StockCapacityExceeded } from '@stock/domain/errors/stock-capacity-exceeded.error';
import { type VariantNotFound } from '@stock/domain/errors/variant-not-found.error';

export class StockProblems {
  static variantNotFound(error: VariantNotFound): ProblemException {
    return ProblemException.notFound(error, `Variant ${error.sku} not found`);
  }

  static insufficientStock(error: InsufficientStock): ProblemException {
    return ProblemException.conflict(error, `Not enough stock for ${error.sku}`, {
      requested: error.requested,
      available: error.available,
    });
  }

  static stockCapacityExceeded(error: StockCapacityExceeded): ProblemException {
    return ProblemException.conflict(error, `Stock capacity exceeded for ${error.sku}`, {
      requested: error.requested,
      onHand: error.onHand,
      capacity: error.capacity,
    });
  }

  static idempotencyKeyReused(error: IdempotencyKeyReused): ProblemException {
    return ProblemException.unprocessable(
      error,
      'Idempotency-Key was already used for a different request',
    );
  }
}
