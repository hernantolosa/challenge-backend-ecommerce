import { type InvariantViolated } from '@utils/errors/invariant-violated.error';
import { exhaustiveMatchGuard } from '@utils/exhaustive-match-guard';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';
import { type StockAdjustmentInput } from '@stock/domain/interfaces/stock-adjustment-input.interface';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock-level.constants';
import { type MovementReason } from '@stock/domain/enums/movement-reason';
import { directionOf } from '@stock/domain/policies/stock-direction.policy';
import { InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { StockCapacityExceeded } from '@stock/domain/errors/stock-capacity-exceeded.error';
import { Quantity } from './quantity';
import { Sku } from './sku';

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
