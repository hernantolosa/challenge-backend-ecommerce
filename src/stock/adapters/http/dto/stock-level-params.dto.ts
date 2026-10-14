import { IsString, Matches, MaxLength } from 'class-validator';
import {
  SKU_FORMAT_MESSAGE,
  SKU_MAX_LENGTH,
} from '@stock/domain/constants/stock.constants';
import { SKU_INPUT_PATTERN } from '@stock/adapters/http/sku-input.constants';

export class StockLevelParamsDto {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  @Matches(SKU_INPUT_PATTERN, { message: `sku ${SKU_FORMAT_MESSAGE}` })
  readonly sku!: string;
}
