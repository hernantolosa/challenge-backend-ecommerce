import { type InsufficientStock } from '../../domain/errors/insufficient-stock.error';
import { type VariantNotFound } from '../../domain/errors/variant-not-found.error';
import { type IdempotencyKeyTaken } from './idempotency-key-taken.error';

export type RecordEntryError = VariantNotFound | InsufficientStock | IdempotencyKeyTaken;
