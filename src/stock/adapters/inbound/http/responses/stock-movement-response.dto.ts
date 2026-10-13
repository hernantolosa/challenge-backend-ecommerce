import { type StockMovementDto } from '@stock/application/dto/stock-movement.dto';
import { type MovementReason } from '@stock/domain/enums/movement-reason';

export class StockMovementResponseDto {
  private constructor(
    readonly id: string,
    readonly sku: string,
    readonly quantity: number,
    readonly reason: MovementReason,
    readonly balanceAfter: number,
    readonly occurredAt: string,
  ) {}

  static from(dto: StockMovementDto): StockMovementResponseDto {
    return new StockMovementResponseDto(
      dto.id,
      dto.sku,
      dto.quantity,
      dto.reason,
      dto.balanceAfter,
      dto.occurredAt.toISOString(),
    );
  }
}
