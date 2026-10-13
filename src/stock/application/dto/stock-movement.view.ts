import { type MovementReason } from '../../domain/movement-reason';

export interface StockMovementView {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly balanceAfter: number;
  readonly occurredAt: Date;
}
