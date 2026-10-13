import { type MovementReason } from '../../domain/movement-reason';

export interface RecordStockMovementCommand {
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly idempotencyKey: string;
  readonly actor: string;
}
