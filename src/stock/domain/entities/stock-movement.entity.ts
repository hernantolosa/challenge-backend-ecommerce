import { type MovementReason } from '@stock/domain/enums/movement-reason.enum';

export interface StockMovement {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly balanceAfter: number;
  readonly createdBy: string;
  readonly idempotencyKey: string;
  readonly occurredAt: Date;
}
