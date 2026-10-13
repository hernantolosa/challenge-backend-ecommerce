import { type MovementReason } from '@stock/domain/enums/movement-reason.enum';

export interface StockMovementResponseDto {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly balanceAfter: number;
  readonly occurredAt: string;
}
