import { IsString, Matches, MaxLength } from 'class-validator';
import { SKU_MAX_LENGTH } from '@shared-kernel/constants/sku.constants';
import {
  SKU_INPUT_MESSAGE,
  SKU_INPUT_PATTERN,
} from '@stock/adapters/inbound/http/constants/input-patterns';

export class StockLevelParamsDto {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  @Matches(SKU_INPUT_PATTERN, { message: SKU_INPUT_MESSAGE })
  readonly sku!: string;
}
