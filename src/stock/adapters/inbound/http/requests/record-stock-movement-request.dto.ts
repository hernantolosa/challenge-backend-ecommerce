import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { MOVEMENT_REASONS, type MovementReason } from '@stock/domain/enums/movement-reason';
import { MAX_MOVEMENT_QUANTITY } from '@stock/domain/constants/quantity.constants';
import { SKU_MAX_LENGTH } from '@shared-kernel/constants/sku.constants';
import {
  SKU_INPUT_MESSAGE,
  SKU_INPUT_PATTERN,
} from '@stock/adapters/inbound/http/constants/input-patterns';

export class RecordStockMovementRequestDto {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  @Matches(SKU_INPUT_PATTERN, { message: SKU_INPUT_MESSAGE })
  readonly sku!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_MOVEMENT_QUANTITY)
  readonly quantity!: number;

  @IsIn(MOVEMENT_REASONS)
  readonly reason!: MovementReason;
}
