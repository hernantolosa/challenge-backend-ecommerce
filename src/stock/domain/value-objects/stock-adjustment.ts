import { type InvariantViolated } from '../../../utils/errors/invariant-violated.error';
import { exhaustiveMatchGuard } from '../../../utils/exhaustive-match-guard';
import { Ok } from '../../../utils/result/ok';
import { type Result } from '../../../utils/result/types/result.type';
import { type StockAdjustmentInput } from '../interfaces/stock-adjustment-input.interface';
import { type StockMovement } from '../interfaces/stock-movement.interface';
import { directionOf, type MovementReason } from '../enums/movement-reason';
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

  isSameRequestAs(movement: StockMovement): boolean {
    return (
      movement.sku === this.sku.value &&
      movement.quantity === this.quantity.value &&
      movement.reason === this.reason
    );
  }
}
