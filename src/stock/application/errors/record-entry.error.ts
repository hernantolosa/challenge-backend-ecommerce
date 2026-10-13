import { type InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { type StockCapacityExceeded } from '@stock/domain/errors/stock-capacity-exceeded.error';
import { type VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { type IdempotencyKeyTaken } from './idempotency-key-taken.error';

export type RecordEntryError =
  | VariantNotFound
  | InsufficientStock
  | StockCapacityExceeded
  | IdempotencyKeyTaken;
