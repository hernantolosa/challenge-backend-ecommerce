import { type InvariantViolated } from '../../utils/invariant-violated';
import { Ok, type Result } from '../../utils/result';
import { directionOf, type MovementReason } from './movement-reason';
import { Quantity } from './quantity';
import { Sku } from './sku';
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
