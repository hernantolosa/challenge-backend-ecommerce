import { type MovementReason } from './movement-reason';

export interface StockMovement {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly balanceAfter: number;
  readonly actor: string;
  readonly idempotencyKey: string;
  readonly occurredAt: Date;
}

export interface StockLevel {
  readonly sku: string;
  readonly onHand: number;
}
