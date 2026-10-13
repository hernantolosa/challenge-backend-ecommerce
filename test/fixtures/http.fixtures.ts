import { MovementReason } from '@stock/domain/movement-reason';
import { SNEAKER_SKU } from '@test/fixtures/stock.fixtures';

export interface MovementBody {
  readonly sku?: unknown;
  readonly quantity?: unknown;
  readonly reason?: unknown;
  readonly [extra: string]: unknown;
}

export const MOVEMENTS_PATH = '/stock/movimientos';

export function aMovementBody(overrides: MovementBody = {}): MovementBody {
  return { sku: SNEAKER_SKU, quantity: 2, reason: MovementReason.SALE, ...overrides };
}
