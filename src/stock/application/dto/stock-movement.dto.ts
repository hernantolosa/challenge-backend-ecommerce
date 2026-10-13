import { type MovementReason } from '@stock/domain/enums/movement-reason';

export interface StockMovementDto {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly balanceAfter: number;
  readonly occurredAt: Date;
}
