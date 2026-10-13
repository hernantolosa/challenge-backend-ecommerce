import { type IdempotencyKeyReused } from '@stock/domain/errors/idempotency-key-reused.error';
import { type InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { type VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { type InvariantViolated } from '@utils/errors/invariant-violated.error';

export type RecordStockMovementError =
  | InvariantViolated
  | VariantNotFound
  | InsufficientStock
  | IdempotencyKeyReused;
