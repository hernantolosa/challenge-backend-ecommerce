import { type StockMovementRow } from '@stock/adapters/outbound/persistence/rows/stock-movement.row';
import { Sku } from '@stock/domain/value-objects/sku';
import { unwrap } from '@test/support/unwrap';
import { type RecordStockMovementInputDto } from '@stock/application/dto/record-stock-movement-input.dto';
import { MovementReason } from '@stock/domain/enums/movement-reason';
import { type StockAdjustmentInput } from '@stock/domain/interfaces/stock-adjustment-input.interface';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';

export const SNEAKER_SKU = 'SNK-RUN-42-BLK';
export const UNKNOWN_SKU = 'DOES-NOT-EXIST';
export const ACTOR = 'warehouse-operator-1';
export const OTHER_ACTOR = 'warehouse-operator-2';
export const IDEMPOTENCY_KEY = '3f0e2b4c-6d1a-4f8e-9b7c-2a5d8e1f4c60';
export const OTHER_IDEMPOTENCY_KEY = '9c1d7e3a-2b4f-4a6c-8d0e-5f7a9b1c3e2d';

export function anAdjustmentInput(
  overrides: Partial<StockAdjustmentInput> = {},
): StockAdjustmentInput {
  return { sku: SNEAKER_SKU, quantity: 2, reason: MovementReason.SALE, ...overrides };
}

export function aRecordCommand(
  overrides: Partial<RecordStockMovementInputDto> = {},
): RecordStockMovementInputDto {
  return {
    sku: SNEAKER_SKU,
    quantity: 2,
    reason: MovementReason.SALE,
    idempotencyKey: IDEMPOTENCY_KEY,
    actor: ACTOR,
    ...overrides,
  };
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

export function aSku(raw: string = SNEAKER_SKU): Sku {
  return unwrap(Sku.make(raw));
}

export function aStockMovementRow(overrides: Partial<StockMovementRow> = {}): StockMovementRow {
  return { ...aStockMovement(), ...overrides };
}
