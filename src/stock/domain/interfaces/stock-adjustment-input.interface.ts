import { type MovementReason } from '../enums/movement-reason';

export interface StockAdjustmentInput {
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
}
