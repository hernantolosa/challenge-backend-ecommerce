import { type MovementReason } from '../movement-reason';

export interface StockAdjustmentInput {
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
}
