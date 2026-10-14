import { IsIn, IsInt, IsString } from 'class-validator';
import { MOVEMENT_REASONS, type MovementReason } from '@stock/domain/enums/movement-reason.enum';

export class RecordStockMovementRequestDto {
  @IsString()
  readonly sku!: string;

  @IsInt()
  readonly quantity!: number;

  @IsIn(MOVEMENT_REASONS)
  readonly reason!: MovementReason;
}
