import { IsIn, IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { MOVEMENT_REASONS, type MovementReason } from '@stock/domain/movement-reason';
import {
  IDEMPOTENCY_KEY_FORMAT_MESSAGE,
  MAX_MOVEMENT_QUANTITY,
  MIN_MOVEMENT_QUANTITY,
  SKU_FORMAT_MESSAGE,
  SKU_MAX_LENGTH,
  SKU_PATTERN,
  UUID_PATTERN,
} from '@stock/domain/stock.constants';
import { type StockLevel, type StockMovement } from '@stock/domain/stock-movement';

const SKU_INPUT_PATTERN = new RegExp(SKU_PATTERN.source, 'i');
const IDEMPOTENCY_KEY_INPUT_PATTERN = new RegExp(UUID_PATTERN.source, 'i');

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

export class StockLevelParamsDto {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  @Matches(SKU_INPUT_PATTERN, { message: `sku ${SKU_FORMAT_MESSAGE}` })
  readonly sku!: string;
}

export class IdempotencyKeyHeaderDto {
  @IsString({ message: 'Idempotency-Key header is required' })
  @Matches(IDEMPOTENCY_KEY_INPUT_PATTERN, {
    message: `Idempotency-Key ${IDEMPOTENCY_KEY_FORMAT_MESSAGE}`,
  })
  readonly idempotencyKey!: string;
}

export interface StockMovementResponseDto {
  readonly id: string;
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly balanceAfter: number;
  readonly occurredAt: string;
}

export interface StockLevelResponseDto {
  readonly sku: string;
  readonly onHand: number;
}

export function toStockMovementResponseDto(movement: StockMovement): StockMovementResponseDto {
  return {
    id: movement.id,
    sku: movement.sku,
    quantity: movement.quantity,
    reason: movement.reason,
    balanceAfter: movement.balanceAfter,
    occurredAt: movement.occurredAt.toISOString(),
  };
}

export function toStockLevelResponseDto(level: StockLevel): StockLevelResponseDto {
  return { sku: level.sku, onHand: level.onHand };
}
