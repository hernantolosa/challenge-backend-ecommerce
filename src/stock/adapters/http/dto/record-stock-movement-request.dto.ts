import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { MOVEMENT_REASONS, type MovementReason } from '@stock/domain/enums/movement-reason.enum';
import {
  MAX_MOVEMENT_QUANTITY,
  MIN_MOVEMENT_QUANTITY,
  SKU_FORMAT_MESSAGE,
  SKU_MAX_LENGTH,
} from '@stock/domain/constants/stock.constants';
import { SKU_INPUT_PATTERN } from '@stock/adapters/http/dto/sku-input.constants';

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
