import { unwrap } from '@test/support/unwrap';
import { MovementReason, MOVEMENT_REASONS } from '@stock/domain/enums/movement-reason';
import { StockAdjustment } from '@stock/domain/value-objects/stock-adjustment';
import { anAdjustmentInput, aStockMovement } from '@test/fixtures/stock.fixtures';

function adjustmentFor(overrides: Parameters<typeof anAdjustmentInput>[0]): StockAdjustment {
  return unwrap(StockAdjustment.make(anAdjustmentInput(overrides)));
}

describe('StockAdjustment', () => {
  it.each([
    [MovementReason.SALE, -3],
    [MovementReason.ADJUSTMENT_DECREASE, -3],
    [MovementReason.RETURN, 3],
    [MovementReason.RESTOCK, 3],
    [MovementReason.ADJUSTMENT_INCREASE, 3],
  ])('derives the stock delta of a %s from the reason, not from the client', (reason, delta) => {
    expect(adjustmentFor({ reason, quantity: 3 }).stockDelta).toBe(delta);
  });

  it('covers every movement reason with a direction', () => {
    const deltas = MOVEMENT_REASONS.map(
      (reason) => adjustmentFor({ reason, quantity: 1 }).stockDelta,
    );

    expect(deltas.every((delta) => Math.abs(delta) === 1)).toBe(true);
  });

  it('normalizes the sku', () => {
    expect(adjustmentFor({ sku: 'snk-run-42-blk' }).sku.value).toBe('SNK-RUN-42-BLK');
  });

  it('reports the first violated invariant', () => {
    expect(StockAdjustment.make(anAdjustmentInput({ sku: '', quantity: 0 }))).toMatchObject({
      kind: 'InvariantViolated',
      error: { kind: 'InvariantViolated', field: 'sku' },
    });
  });

  it('reports an invalid quantity', () => {
    expect(StockAdjustment.make(anAdjustmentInput({ quantity: -1 }))).toMatchObject({
      kind: 'InvariantViolated',
      error: { kind: 'InvariantViolated', field: 'quantity' },
    });
  });

  describe('isSameRequestAs', () => {
    const adjustment = adjustmentFor({ quantity: 2, reason: MovementReason.SALE });

    it('matches a movement recorded from an identical request', () => {
      expect(adjustment.isSameRequestAs(aStockMovement())).toBe(true);
    });

    it.each([
      ['sku', { sku: 'OTHER-SKU' }],
      ['quantity', { quantity: 5 }],
      ['reason', { reason: MovementReason.RETURN }],
    ])('does not match when the %s differs', (_field, overrides) => {
      expect(adjustment.isSameRequestAs(aStockMovement(overrides))).toBe(false);
    });
  });
});
