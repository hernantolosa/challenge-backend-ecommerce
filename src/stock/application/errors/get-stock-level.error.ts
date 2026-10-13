import { type VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { type InvariantViolated } from '@utils/errors/invariant-violated.error';

export type GetStockLevelError = InvariantViolated | VariantNotFound;
