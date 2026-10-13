import { IsString, Matches, MaxLength } from 'class-validator';
import { SKU_MAX_LENGTH } from '@stock/domain/value-objects/sku';
import {
  SKU_FORMAT_MESSAGE,
  SKU_INPUT_PATTERN,
} from '@stock/adapters/inbound/http/constants/input-patterns';

export class StockLevelParamsDto {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  @Matches(SKU_INPUT_PATTERN, { message: SKU_FORMAT_MESSAGE })
  readonly sku!: string;
}
