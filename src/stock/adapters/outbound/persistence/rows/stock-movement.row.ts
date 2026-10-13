export interface StockMovementRow {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: string;
  readonly balanceAfter: number;
  readonly actor: string;
  readonly idempotencyKey: string;
  readonly occurredAt: Date;
}
