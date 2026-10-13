import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { MOVEMENT_REASONS, type MovementReason } from '@stock/domain/movement-reason';
import {
  MAX_MOVEMENT_QUANTITY,
  MIN_MOVEMENT_QUANTITY,
  SKU_FORMAT_MESSAGE,
  SKU_MAX_LENGTH,
  SKU_PATTERN,
} from '@stock/domain/stock.constants';

const SKU_INPUT_PATTERN = new RegExp(SKU_PATTERN.source, 'i');

export class RecordStockMovementRequestDto {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  @Matches(SKU_INPUT_PATTERN, { message: `sku ${SKU_FORMAT_MESSAGE}` })
  readonly sku!: string;

  @IsInt()
  @Min(MIN_MOVEMENT_QUANTITY)
  @Max(MAX_MOVEMENT_QUANTITY)
  readonly quantity!: number;

  @IsIn(MOVEMENT_REASONS)
  readonly reason!: MovementReason;
}
