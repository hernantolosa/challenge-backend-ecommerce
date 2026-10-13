import { MovementReason } from '@stock/domain/enums/movement-reason';
import { type MovementBody } from '@test/fixtures/interfaces/movement-body.interface';
import { SNEAKER_SKU } from '@test/fixtures/stock.fixtures';

export const MOVEMENTS_PATH = '/stock/movimientos';

export function aMovementBody(overrides: MovementBody = {}): MovementBody {
  return { sku: SNEAKER_SKU, quantity: 2, reason: MovementReason.SALE, ...overrides };
}
