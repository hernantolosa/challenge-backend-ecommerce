import { type InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { type VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { type IdempotencyKeyTaken } from './idempotency-key-taken.error';

export type RecordEntryError = VariantNotFound | InsufficientStock | IdempotencyKeyTaken;
