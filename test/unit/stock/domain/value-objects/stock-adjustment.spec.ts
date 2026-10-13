import { unwrap } from '@test/support/unwrap';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock-level.constants';
import { MovementReason, MOVEMENT_REASONS } from '@stock/domain/enums/movement-reason';
import { StockAdjustment } from '@stock/domain/value-objects/stock-adjustment';
import { anAdjustmentInput, aStockMovement, SNEAKER_SKU } from '@test/fixtures/stock.fixtures';

function adjustmentFor(overrides: Parameters<typeof anAdjustmentInput>[0]): StockAdjustment {
  return unwrap(StockAdjustment.make(anAdjustmentInput(overrides)));
}

const EXPECTED_DIRECTIONS: Readonly<Record<MovementReason, number>> = {
  [MovementReason.SALE]: -1,
  [MovementReason.ADJUSTMENT_DECREASE]: -1,
  [MovementReason.RETURN]: 1,
  [MovementReason.RESTOCK]: 1,
  [MovementReason.ADJUSTMENT_INCREASE]: 1,
};

describe('StockAdjustment', () => {
  it.each(MOVEMENT_REASONS.map((reason) => [reason, EXPECTED_DIRECTIONS[reason] * 3] as const))(
    'derives the stock delta of a %s from the reason, not from the client',
    (reason, delta) => {
      expect(adjustmentFor({ reason, quantity: 3 }).stockDelta).toBe(delta);
    },
  );

  it('assigns a direction to every movement reason', () => {
    expect(Object.keys(EXPECTED_DIRECTIONS).sort()).toEqual([...MOVEMENT_REASONS].sort());
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

  describe('fitsWithin', () => {
    it.each([
      ['an outbound movement leaving stock at zero', MovementReason.SALE, 3, 3, true],
      ['an outbound movement going below zero', MovementReason.SALE, 4, 3, false],
      [
        'an inbound movement reaching the capacity',
        MovementReason.RESTOCK,
        5,
        MAX_STOCK_LEVEL - 5,
        true,
      ],
      [
        'an inbound movement above the capacity',
        MovementReason.RESTOCK,
        6,
        MAX_STOCK_LEVEL - 5,
        false,
      ],
    ])('accepts or rejects %s', (_case, reason, quantity, onHand, fits) => {
      expect(adjustmentFor({ reason, quantity }).fitsWithin(onHand)).toBe(fits);
    });
  });

  describe('rejectionAgainst', () => {
    it('rejects an outbound movement for insufficient stock', () => {
      expect(
        adjustmentFor({ reason: MovementReason.SALE, quantity: 5 }).rejectionAgainst(2),
      ).toEqual({
        kind: 'InsufficientStock',
        error: { kind: 'InsufficientStock', sku: SNEAKER_SKU, requested: 5, available: 2 },
      });
    });

    it('rejects an inbound movement for exceeding the capacity', () => {
      expect(
        adjustmentFor({ reason: MovementReason.RESTOCK, quantity: 9 }).rejectionAgainst(
          MAX_STOCK_LEVEL - 1,
        ),
      ).toMatchObject({ kind: 'StockCapacityExceeded', error: { capacity: MAX_STOCK_LEVEL } });
    });

    it('decides the reason from the direction, not from a stock level read later', () => {
      const sale = adjustmentFor({ reason: MovementReason.SALE, quantity: 5 });

      expect(sale.rejectionAgainst(1_000).kind).toBe('InsufficientStock');
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
