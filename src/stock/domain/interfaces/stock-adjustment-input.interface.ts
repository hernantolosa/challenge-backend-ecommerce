import { type MovementReason } from '@stock/domain/enums/movement-reason';

export interface StockAdjustmentInput {
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
}
