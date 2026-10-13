import { type InvariantViolated } from '../../utils/errors/invariant-violated.error';
import { Ok } from '../../utils/result/ok';
import { type Result } from '../../utils/result/result';
import { type StockAdjustmentInput } from './interfaces/stock-adjustment-input.interface';
import { type StockMovement } from './interfaces/stock-movement.interface';
import { directionOf, type MovementReason } from './movement-reason';
import { Quantity } from './value-objects/quantity';
import { Sku } from './value-objects/sku';

export class StockAdjustment {
  private constructor(
    readonly sku: Sku,
    readonly quantity: Quantity,
    readonly reason: MovementReason,
  ) {}

  static make(input: StockAdjustmentInput): Result<StockAdjustment, InvariantViolated> {
    const sku = Sku.make(input.sku);
    if (!sku.ok) return sku;

    const quantity = Quantity.make(input.quantity);
    if (!quantity.ok) return quantity;

    return Ok.make(new StockAdjustment(sku.value, quantity.value, input.reason));
  }

  get delta(): number {
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
