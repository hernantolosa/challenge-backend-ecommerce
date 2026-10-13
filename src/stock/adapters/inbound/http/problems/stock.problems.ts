import { HttpOutcome } from '@infrastructure/http/builders/http-outcome.builder';
import { type ProblemException } from '@infrastructure/http/exceptions/problem.exception';
import { type IdempotencyKeyReused } from '@stock/domain/errors/idempotency-key-reused.error';
import { type InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { type VariantNotFound } from '@stock/domain/errors/variant-not-found.error';

export class StockProblems {
  static variantNotFound(error: VariantNotFound): ProblemException {
    return HttpOutcome.notFound(error, `Variant ${error.sku} not found`);
  }

  static insufficientStock(error: InsufficientStock): ProblemException {
    return HttpOutcome.conflict(error, `Not enough stock for ${error.sku}`, {
      requested: error.requested,
      available: error.available,
    });
  }

  static idempotencyKeyReused(error: IdempotencyKeyReused): ProblemException {
    return HttpOutcome.unprocessable(
      error,
      'Idempotency-Key was already used for a different request',
    );
  }
}
