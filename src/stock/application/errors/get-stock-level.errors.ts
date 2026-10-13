import { type InvariantViolated } from '@shared/errors/invariant-violated.error';
import { type VariantNotFound } from '@stock/domain/errors/variant-not-found.error';

export type GetStockLevelError = InvariantViolated | VariantNotFound;
