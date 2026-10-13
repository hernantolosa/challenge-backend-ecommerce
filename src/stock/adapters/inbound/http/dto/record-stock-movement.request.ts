import { IsIn, IsInt, IsString, MaxLength } from 'class-validator';
import { MOVEMENT_REASONS, type MovementReason } from '../../../../domain/movement-reason';
import { SKU_MAX_LENGTH } from '../../../../domain/sku';

export class RecordStockMovementRequest {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  readonly sku!: string;

  @IsInt()
  readonly quantity!: number;

  @IsIn(MOVEMENT_REASONS)
  readonly reason!: MovementReason;
}
