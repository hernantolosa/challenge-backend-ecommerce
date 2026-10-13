import { type VariantNotFound } from '../../domain/errors/variant-not-found.error';
import { type InvariantViolated } from '../../../utils/errors/invariant-violated.error';

export type GetStockLevelError = InvariantViolated | VariantNotFound;
