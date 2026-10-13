import { MovementReason } from '../../src/stock/domain/movement-reason';
import { type StockAdjustmentInput } from '../../src/stock/domain/stock-adjustment';
import { type StockMovement } from '../../src/stock/domain/stock-movement';

export const SNEAKER_SKU = 'SNK-RUN-42-BLK';
export const UNKNOWN_SKU = 'DOES-NOT-EXIST';
export const ACTOR = 'warehouse-operator-1';
export const OTHER_ACTOR = 'warehouse-operator-2';
export const IDEMPOTENCY_KEY = '3f0e2b4c-6d1a-4f8e-9b7c-2a5d8e1f4c60';
export const OTHER_IDEMPOTENCY_KEY = '9c1d7e3a-2b4f-4a6c-8d0e-5f7a9b1c3e2d';

export function anAdjustmentInput(overrides: Partial<StockAdjustmentInput> = {}): StockAdjustmentInput {
  return { sku: SNEAKER_SKU, quantity: 2, reason: MovementReason.SALE, ...overrides };
}

export function aStockMovement(overrides: Partial<StockMovement> = {}): StockMovement {
  return {
    id: 'b7e4c2a1-5d3f-4e8b-9a6c-1f2d3e4a5b6c',
    sku: SNEAKER_SKU,
    quantity: 2,
    reason: MovementReason.SALE,
    balanceAfter: 8,
    actor: ACTOR,
    idempotencyKey: IDEMPOTENCY_KEY,
    occurredAt: new Date('2026-10-13T12:00:00.000Z'),
    ...overrides,
  };
}
