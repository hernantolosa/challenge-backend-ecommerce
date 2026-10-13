import { type InvariantViolated } from '@shared/errors/invariant-violated.error';
import { Err } from '@shared/result/err';
import { exhaustiveMatchGuard } from '@shared/result/match';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result';
import { directionOf, type MovementReason } from './movement-reason';
import { Quantity } from './quantity';
import { Sku } from './sku';
import { MAX_STOCK_LEVEL } from './stock.constants';
import { InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { StockCapacityExceeded } from '@stock/domain/errors/stock-capacity-exceeded.error';
import { type StockMovement } from './stock-movement';

export class StockAdjustment {
  private constructor(
    readonly sku: Sku,
    readonly quantity: Quantity,
    readonly reason: MovementReason,
  ) {}

  static make(
    sku: string,
    quantity: number,
    reason: MovementReason,
  ): Result<StockAdjustment, InvariantViolated> {
    const validSku = Sku.make(sku);

    switch (validSku.kind) {
      case 'Ok':
        return StockAdjustment.makeWithValidSku(validSku.value, quantity, reason);
      case 'InvariantViolated':
        return validSku;
      default:
        return exhaustiveMatchGuard(validSku);
    }
  }

  private static makeWithValidSku(
    sku: Sku,
    quantity: number,
    reason: MovementReason,
  ): Result<StockAdjustment, InvariantViolated> {
    const validQuantity = Quantity.make(quantity);

    switch (validQuantity.kind) {
      case 'Ok':
        return Ok.make(new StockAdjustment(sku, validQuantity.value, reason));
      case 'InvariantViolated':
        return validQuantity;
      default:
        return exhaustiveMatchGuard(validQuantity);
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
