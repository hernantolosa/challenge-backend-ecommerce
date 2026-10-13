import { type MovementReason } from '@stock/domain/enums/movement-reason.enum';

export interface RecordStockMovementInputDto {
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly idempotencyKey: string;
  readonly actor: string;
}
