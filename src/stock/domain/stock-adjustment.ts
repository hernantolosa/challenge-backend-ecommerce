import { type InvariantViolated } from '@shared/invariant-violated';
import { Err, exhaustiveMatchGuard, Ok, type Result } from '@shared/result';
import { directionOf, type MovementReason } from './movement-reason';
import { Quantity } from './quantity';
import { Sku } from './sku';
import { MAX_STOCK_LEVEL } from './stock.constants';
import { InsufficientStock, StockCapacityExceeded } from './stock.errors';
import { type StockMovement } from './stock-movement';

export interface StockAdjustmentInput {
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
}

export class StockAdjustment {
  private constructor(
    readonly sku: Sku,
    readonly quantity: Quantity,
    readonly reason: MovementReason,
  ) {}

  static make(input: StockAdjustmentInput): Result<StockAdjustment, InvariantViolated> {
    const sku = Sku.make(input.sku);

    switch (sku.kind) {
      case 'Ok':
        return StockAdjustment.makeWithValidSku(sku.value, input);
      case 'InvariantViolated':
        return sku;
      default:
        return exhaustiveMatchGuard(sku);
    }
  }

  private static makeWithValidSku(
    sku: Sku,
    input: StockAdjustmentInput,
  ): Result<StockAdjustment, InvariantViolated> {
    const quantity = Quantity.make(input.quantity);

    switch (quantity.kind) {
      case 'Ok':
        return Ok.make(new StockAdjustment(sku, quantity.value, input.reason));
      case 'InvariantViolated':
        return quantity;
      default:
        return exhaustiveMatchGuard(quantity);
    }
  }

  get stockDelta(): number {
    return this.quantity.value * directionOf(this.reason);
  }

  fitsWithin(onHand: number): boolean {
    const balanceAfter = onHand + this.stockDelta;
    return balanceAfter >= 0 && balanceAfter <= MAX_STOCK_LEVEL;
  }

  rejectionAgainst(onHand: number): Err<InsufficientStock> | Err<StockCapacityExceeded> {
    if (this.stockDelta < 0) {
      return Err.make(InsufficientStock.make(this.sku.value, this.quantity.value, onHand));
    }
    return Err.make(
      StockCapacityExceeded.make(this.sku.value, this.quantity.value, onHand, MAX_STOCK_LEVEL),
    );
  }

  isSameRequestAs(movement: StockMovement): boolean {
    return (
      movement.sku === this.sku.value &&
      movement.quantity === this.quantity.value &&
      movement.reason === this.reason
    );
  }
}
